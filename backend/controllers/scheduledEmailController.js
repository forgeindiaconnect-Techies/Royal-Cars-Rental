const ScheduledEmail = require('../models/scheduledEmail');
const { scheduleOrSendEmail, processPendingScheduledEmails } = require('../utils/emailScheduler');

// @desc    Schedule a new email (Automated 10:00 AM dispatch on scheduled date)
// @route   POST /api/scheduled-emails
// @access  Private (Admin / Staff)
exports.createScheduledEmail = async (req, res) => {
  try {
    const { to, recipientName, subject, html, text, scheduledDate, targetHour, targetMinute, relatedType, relatedId } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipient email (to), subject, and html body content',
      });
    }

    const result = await scheduleOrSendEmail({
      to,
      recipientName: recipientName || '',
      subject,
      html,
      text: text || '',
      scheduledDate: scheduledDate || new Date(),
      targetHour: targetHour !== undefined ? Number(targetHour) : 10,
      targetMinute: targetMinute !== undefined ? Number(targetMinute) : 0,
      relatedType: relatedType || 'custom',
      relatedId: relatedId || null,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error('[ScheduledEmailController] Error scheduling email:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all scheduled emails (pending & sent)
// @route   GET /api/scheduled-emails
// @access  Private (Admin / Staff)
exports.getScheduledEmails = async (req, res) => {
  try {
    const { status, relatedType, email } = req.query;
    const query = {};

    if (status) query.status = status;
    if (relatedType) query.relatedType = relatedType;
    if (email) query.to = { $regex: email, $options: 'i' };

    const emails = await ScheduledEmail.find(query).sort({ scheduledTime: 1, createdAt: -1 });

    const stats = {
      total: emails.length,
      pending: emails.filter(e => e.status === 'pending').length,
      sent: emails.filter(e => e.status === 'sent').length,
      failed: emails.filter(e => e.status === 'failed').length,
    };

    res.status(200).json({
      success: true,
      count: emails.length,
      stats,
      emails,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a pending scheduled email
// @route   DELETE /api/scheduled-emails/:id
// @access  Private (Admin / Staff)
exports.cancelScheduledEmail = async (req, res) => {
  try {
    const emailItem = await ScheduledEmail.findById(req.params.id);
    if (!emailItem) {
      return res.status(404).json({ success: false, message: 'Scheduled email record not found' });
    }

    if (emailItem.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot cancel email with status '${emailItem.status}'` });
    }

    emailItem.status = 'cancelled';
    await emailItem.save();

    res.status(200).json({
      success: true,
      message: 'Scheduled email cancelled successfully',
      emailItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manually trigger due scheduled emails dispatch
// @route   POST /api/scheduled-emails/trigger
// @access  Private (Admin)
exports.triggerScheduledEmailDispatch = async (req, res) => {
  try {
    await processPendingScheduledEmails();
    res.status(200).json({ success: true, message: 'Scheduled email dispatch processed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
