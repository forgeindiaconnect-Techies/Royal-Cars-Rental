const mongoose = require('mongoose');
const Company = require('../models/company');
const User = require('../models/user');
require('dotenv').config({ path: '../.env' });

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fleetmind-ai';
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri);
    console.log('Connected!');
    
    const companies = await Company.find({});
    console.log('\n--- ALL COMPANIES IN DB ---');
    companies.forEach(c => {
      console.log(`ID: ${c._id} | Name: ${c.name} | Owner: ${c.ownerEmail} | Status: ${c.status}`);
    });

    const admins = await User.find({ role: 'company-admin' });
    console.log('\n--- ALL COMPANY ADMIN USERS IN DB ---');
    admins.forEach(u => {
      console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Co ID: ${u.companyId} | Status: ${u.status}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
