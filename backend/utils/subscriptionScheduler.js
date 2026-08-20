const { sendSubscriptionExpiryEmail } = require('./sendEmail');

/**
 * Subscription Expiry Automated Scheduler
 * Runs daily or on demand to check company subscription expiry dates,
 * updates expired statuses, and dispatches Brevo email notifications.
 */
const runSubscriptionExpiryCheck = async (CompanyModel) => {
  console.log('[SUBSCRIPTION SCHEDULER] Running daily subscription expiry check...');
  const results = {
    checkedCount: 0,
    expiredCount: 0,
    remindersSent: 0,
    details: []
  };

  try {
    let companies = [];
    if (CompanyModel) {
      companies = await CompanyModel.find({ status: { $ne: 'suspended' } });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const comp of companies) {
      results.checkedCount++;
      const expiryRaw = comp.subscriptionExpiry || comp.subscriptionExpiryDate;
      const expiry = expiryRaw ? new Date(expiryRaw) : null;
      if (!expiry) continue;

      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const ownerEmail = (comp.ownerEmail || comp.email || '').trim();
      const companyName = comp.name || comp.companyName || 'Rental Company';

      // 1. IF EXPIRED (daysLeft <= 0)
      if (daysLeft <= 0) {
        if (comp.status !== 'expired') {
          comp.status = 'expired';
          if (typeof comp.save === 'function') await comp.save();
          results.expiredCount++;
        }

        if (ownerEmail) {
          await sendSubscriptionExpiryEmail({
            companyName,
            ownerEmail,
            planName: comp.plan || 'Professional Plan (₹2999/mo)',
            expiryDate: expiry.toLocaleDateString('en-GB'),
            daysLeft: 0
          });
          results.remindersSent++;
        }

        results.details.push({ companyName, daysLeft: 0, action: 'Marked Expired & Expiry Email Sent (0 Days Left)' });
      } 
      // 2. DAY-WISE AUTOMATED WARNING REMINDERS (7 DAYS, 3 DAYS, 1 DAY BEFORE EXPIRY)
      else if ([7, 3, 1].includes(daysLeft)) {
        if (ownerEmail) {
          await sendSubscriptionExpiryEmail({
            companyName,
            ownerEmail,
            planName: comp.plan || 'Professional Plan (₹2999/mo)',
            expiryDate: expiry.toLocaleDateString('en-GB'),
            daysLeft
          });
          results.remindersSent++;
        }
        results.details.push({ companyName, daysLeft, action: `Day-wise Warning Email Sent (${daysLeft} Days Remaining)` });
      }
    }

    console.log(`[SUBSCRIPTION SCHEDULER FINISHED] Checked: ${results.checkedCount} | Expired: ${results.expiredCount} | Reminders Sent: ${results.remindersSent}`);
  } catch (err) {
    console.error('[SUBSCRIPTION SCHEDULER ERROR]', err.message);
  }

  return results;
};

// Start background cron timer (runs once every 6 hours)
const startSubscriptionCron = (CompanyModel) => {
  // Run once immediately on server start
  setTimeout(() => runSubscriptionExpiryCheck(CompanyModel), 5000);

  // Repeat every 6 hours
  setInterval(() => {
    runSubscriptionExpiryCheck(CompanyModel);
  }, 6 * 60 * 60 * 1000);
};

module.exports = {
  runSubscriptionExpiryCheck,
  startSubscriptionCron
};
