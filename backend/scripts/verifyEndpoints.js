const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rentos_db');
  console.log('--- Verifying Scheduled Emails in Database ---');
  const ScheduledEmail = require('../models/scheduledEmail');
  const count = await ScheduledEmail.countDocuments({});
  const pending = await ScheduledEmail.countDocuments({ status: 'pending' });
  const sent = await ScheduledEmail.countDocuments({ status: 'sent' });

  console.log(`Total Scheduled Email records: ${count}`);
  console.log(`Pending (Suppressed today, scheduled for 10 AM): ${pending}`);
  console.log(`Sent immediately / processed: ${sent}`);

  const samplePending = await ScheduledEmail.findOne({ status: 'pending' });
  if (samplePending) {
    console.log('\nSample Pending Scheduled Email Document:');
    console.log(`  To            : ${samplePending.to}`);
    console.log(`  Subject       : ${samplePending.subject}`);
    console.log(`  Scheduled Time: ${samplePending.scheduledTime.toLocaleString()} (10:00 AM)`);
    console.log(`  Status        : ${samplePending.status}`);
  }

  await mongoose.connection.close();
  console.log('\n✅ Verification Complete!');
  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
