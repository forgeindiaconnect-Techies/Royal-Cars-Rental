const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/booking');
const Company = require('../models/company');
const Otp = require('../models/otp');
const ChatMessage = require('../models/chatMessage');
const Notification = require('../models/notification');
const Offer = require('../models/offer');
const Transaction = require('../models/transaction');
const Location = require('../models/location');

async function wipeAndSeedSuperAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    console.log('\n=========================================================');
    console.log('🧹 INITIATING COMPLETE DATABASE RESET & CLEAN SEED');
    console.log('=========================================================\n');

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas successfully.');

    // Delete all existing documents across all collections
    console.log('🗑️ Deleting all existing companies...');
    await Company.deleteMany({});

    console.log('🗑️ Deleting all existing vehicles and car images...');
    await Vehicle.deleteMany({});

    console.log('🗑️ Deleting all existing bookings...');
    await Booking.deleteMany({});

    console.log('🗑️ Deleting all existing users (company admins, drivers, employees, customers)...');
    await User.deleteMany({});

    console.log('🗑️ Deleting all existing OTP records...');
    await Otp.deleteMany({});

    console.log('🗑️ Deleting all existing chat messages, notifications, offers, transactions, locations...');
    await ChatMessage.deleteMany({});
    await Notification.deleteMany({});
    await Offer.deleteMany({});
    await Transaction.deleteMany({});
    await Location.deleteMany({});

    console.log('\n✨ Database successfully cleared of all old data.');

    // Seed ONLY the single Super Admin Account
    console.log('\n👑 Seeding Primary Super Admin Account...');
    const superAdmin = await User.create({
      name: 'Forge India Super Admin',
      email: 'admin@forgeindia.com',
      password: 'password123',
      role: 'super-admin',
      status: 'active'
    });

    console.log('\n=========================================================');
    console.log('🎉 DATABASE RESET COMPLETE!');
    console.log('=========================================================');
    console.log('  👑 Super Admin Email   : admin@forgeindia.com');
    console.log('  🔑 Super Admin Password: password123');
    console.log('  🆔 Super Admin User ID : ' + superAdmin._id);
    console.log('  🏢 Total Companies    : 0');
    console.log('  🚗 Total Vehicles     : 0');
    console.log('  📅 Total Bookings     : 0');
    console.log('=========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Reset Failed:', error.message);
    process.exit(1);
  }
}

wipeAndSeedSuperAdmin();
