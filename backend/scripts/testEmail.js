const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendSubscriptionExpiryEmail, sendKYCStatusEmail } = require('../utils/sendEmail');

const targetEmail = process.argv[2] || process.env.BREVO_SENDER_EMAIL || 'vaideeswari8@gmail.com';

async function runTest() {
  console.log(`Testing Brevo Email to: ${targetEmail}...`);
  const res1 = await sendSubscriptionExpiryEmail({
    companyName: 'Royal Car Rentals Test',
    ownerEmail: targetEmail,
    planName: 'Pro Plan',
    expiryDate: '30/07/2026',
    daysLeft: 0
  });

  const output = {
    targetEmail,
    brevoKeyConfigured: !!process.env.BREVO_API_KEY,
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
    result: res1,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(path.join(__dirname, 'test_result.json'), JSON.stringify(output, null, 2));
  console.log('Result written to test_result.json:', output);
}

runTest();
