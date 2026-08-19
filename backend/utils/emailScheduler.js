const ScheduledEmail = require('../models/scheduledEmail');
const { sendEmail } = require('./sendEmail');

/**
 * Schedule or send an email automatically.
 * Rule: If scheduled for tomorrow or a future date (or before 10:00 AM on target date),
 * do NOT send today. Queue it to be sent at 10:00 AM on the scheduled date.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} [params.recipientName] - Recipient name
 * @param {string} params.subject - Email subject
 * @param {string} params.html - Email HTML content
 * @param {string} [params.text] - Email text content
 * @param {Date|string} params.scheduledDate - Scheduled date (e.g. startDate or booking day)
 * @param {number} [params.targetHour=10] - Default 10 AM
 * @param {number} [params.targetMinute=0] - Default 0
 * @param {string} [params.relatedType='custom'] - 'booking', 'duty', 'notification', 'subscription', 'custom'
 * @param {string} [params.relatedId] - Associated ObjectId
 */
const scheduleOrSendEmail = async ({
  to,
  recipientName = '',
  subject,
  html,
  text = '',
  scheduledDate,
  targetHour = 10,
  targetMinute = 0,
  relatedType = 'custom',
  relatedId = null,
}) => {
  if (!to || !subject || !html) {
    throw new Error('Missing required email parameters: to, subject, html');
  }

  const now = new Date();
  let targetTime = new Date();

  if (scheduledDate) {
    targetTime = new Date(scheduledDate);
  }

  // Set time to 10:00 AM on the target scheduled date
  targetTime.setHours(targetHour, targetMinute, 0, 0);

  // If targetTime is in the future (e.g., tomorrow morning at 10 AM or later today)
  if (targetTime.getTime() > now.getTime()) {
    console.log(`\n\x1b[35m========================================================================\x1b[0m`);
    console.log(`\x1b[35m[AUTOMATED 10:00 AM EMAIL SCHEDULER QUEUED]\x1b[0m`);
    console.log(`  📩 Recipient    : ${to}`);
    console.log(`  📌 Subject      : ${subject}`);
    console.log(`  📅 Scheduled Day: ${targetTime.toDateString()}`);
    console.log(`  ⏰ Send Time    : ${targetTime.toLocaleTimeString()} (10:00 AM Target)`);
    console.log(`  🛑 Status       : SUPPRESSED TODAY (Will auto-send at 10:00 AM on target date)`);
    console.log(`\x1b[35m========================================================================\x1b[0m\n`);

    const scheduledRecord = await ScheduledEmail.create({
      to,
      recipientName,
      subject,
      html,
      text,
      scheduledDate: new Date(scheduledDate || targetTime),
      scheduledTime: targetTime,
      status: 'pending',
      relatedType,
      relatedId,
    });

    return {
      success: true,
      scheduled: true,
      status: 'pending',
      scheduledTime: targetTime,
      message: `Email scheduled for 10:00 AM on ${targetTime.toDateString()}. Immediate dispatch suppressed today.`,
      scheduledEmailId: scheduledRecord._id,
    };
  }

  // If target time is past or right now, dispatch immediately
  console.log(`[EMAIL SCHEDULER] Immediate dispatch condition met for ${to}`);
  const dispatchResult = await sendEmail({ to, subject, html, text });

  const scheduledRecord = await ScheduledEmail.create({
    to,
    recipientName,
    subject,
    html,
    text,
    scheduledDate: new Date(scheduledDate || now),
    scheduledTime: targetTime,
    status: dispatchResult.success ? 'sent' : 'failed',
    sentAt: dispatchResult.success ? new Date() : null,
    error: dispatchResult.error || '',
    relatedType,
    relatedId,
  });

  return {
    success: dispatchResult.success,
    scheduled: false,
    status: dispatchResult.success ? 'sent' : 'failed',
    message: dispatchResult.success ? 'Email sent immediately' : dispatchResult.error,
    scheduledEmailId: scheduledRecord._id,
  };
};

/**
 * Background Processor: Checks database for pending emails whose 10 AM send time has arrived
 */
const processPendingScheduledEmails = async () => {
  try {
    const now = new Date();
    const pendingEmails = await ScheduledEmail.find({
      status: 'pending',
      scheduledTime: { $lte: now },
    }).limit(50);

    if (pendingEmails.length === 0) return;

    console.log(`\x1b[36m[SCHEDULED EMAIL CRON] Found ${pendingEmails.length} pending email(s) due for 10:00 AM dispatch.\x1b[0m`);

    for (const item of pendingEmails) {
      console.log(`[SCHEDULED EMAIL CRON DISPATCHING] To: ${item.to} | Subject: "${item.subject}" | Scheduled For: ${item.scheduledTime.toLocaleString()}`);
      
      const res = await sendEmail({
        to: item.to,
        subject: item.subject,
        html: item.html,
        text: item.text,
      });

      if (res.success) {
        item.status = 'sent';
        item.sentAt = new Date();
        item.error = '';
      } else {
        item.status = 'failed';
        item.error = res.error || 'Failed to dispatch via Brevo/SMTP';
      }

      await item.save();
    }
  } catch (err) {
    console.error('[SCHEDULED EMAIL CRON ERROR]', err.message);
  }
};

/**
 * Start the background Cron interval (runs every 60 seconds)
 */
const startScheduledEmailCron = () => {
  // Initial check 3 seconds after server start
  setTimeout(processPendingScheduledEmails, 3000);

  // Check every 60 seconds (1 minute)
  setInterval(processPendingScheduledEmails, 60 * 1000);
  console.log('⏰ Automated 10:00 AM Scheduled Email Cron Service Initialized (Interval: 1m)');
};

module.exports = {
  scheduleOrSendEmail,
  processPendingScheduledEmails,
  startScheduledEmailCron,
};
