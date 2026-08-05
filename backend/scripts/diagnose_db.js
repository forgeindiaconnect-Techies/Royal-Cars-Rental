const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');

// dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config({ path: '../.env' }); // load from backend/

const User = require('../models/user');
const Company = require('../models/company');
const Vehicle = require('../models/vehicle');

const run = async () => {
  console.log('Testing DB connection to URI:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');
    
    const userCount = await User.countDocuments();
    const companyCount = await Company.countDocuments();
    const vehicleCount = await Vehicle.countDocuments();
    
    console.log(`📊 DB Counts: Users=${userCount}, Companies=${companyCount}, Vehicles=${vehicleCount}`);
    
    if (userCount === 0) {
      console.log('⚠️ Database appears to be empty. No users found.');
    } else {
      const sampleUser = await User.findOne({});
      console.log('Sample User:', { name: sampleUser.name, email: sampleUser.email, role: sampleUser.role });
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
