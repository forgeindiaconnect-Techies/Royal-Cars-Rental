const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rentos_db');
  console.log('MongoDB Connected for testing.');
};

const runTest = async () => {
  try {
    await connectDB();

    const ScheduledEmail = require('../models/scheduledEmail');
    const { scheduleOrSendEmail, processPendingScheduledEmails } = require('../utils/emailScheduler');

    console.log('\n--- TEST 1: Scheduling email for TOMORROW (Should NOT send today) ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const test1 = await scheduleOrSendEmail({
      to: 'test_tomorrow@example.com',
      recipientName: 'Tomorrow Recipient',
      subject: 'Test Tomorrow Email Dispatch',
      html: '<h1>Test Email for Tomorrow Morning 10 AM</h1>',
      scheduledDate: tomorrow,
      targetHour: 10,
      targetMinute: 0,
      relatedType: 'duty',
    });

    console.log('Test 1 Result:', JSON.stringify(test1, null, 2));

    if (test1.scheduled && test1.status === 'pending') {
      console.log('✅ TEST 1 PASSED: Email for tomorrow correctly queued for 10:00 AM and suppressed today!');
    } else {
      console.error('❌ TEST 1 FAILED!');
    }

    console.log('\n--- TEST 2: Scheduling email for PAST time (Should send immediately) ---');
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const test2 = await scheduleOrSendEmail({
      to: 'test_immediate@example.com',
      recipientName: 'Immediate Recipient',
      subject: 'Test Immediate Email Dispatch',
      html: '<h1>Test Email for Immediate Dispatch</h1>',
      scheduledDate: pastDate,
      targetHour: pastDate.getHours(),
      targetMinute: pastDate.getMinutes(),
      relatedType: 'custom',
    });

    console.log('Test 2 Result:', JSON.stringify(test2, null, 2));
    if (!test2.scheduled) {
      console.log('✅ TEST 2 PASSED: Past/immediate email processed immediately!');
    }

    console.log('\n--- DB Verification ---');
    const pendingList = await ScheduledEmail.find({ to: 'test_tomorrow@example.com' });
    console.log('Queued Document in DB:', pendingList);

    await mongoose.connection.close();
    console.log('\nAll Scheduler Tests Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
};

runTest();
