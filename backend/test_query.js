const mongoose = require('mongoose');
const Company = require('./models/company');
const User = require('./models/user');

const MONGO_URI = 'mongodb://vaideeswari8_db_user:P2EOAvlz5ItR4SJr@ac-wktauyd-shard-00-00.kqycjtk.mongodb.net:27017,ac-wktauyd-shard-00-01.kqycjtk.mongodb.net:27017,ac-wktauyd-shard-00-02.kqycjtk.mongodb.net:27017/fleetmind-ai?ssl=true&replicaSet=atlas-122ick-shard-0&authSource=admin&retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas');
  
  const companies = await Company.find({});
  console.log('--- COMPANIES ---');
  companies.forEach(c => {
    console.log(`ID: ${c._id}, Name: "${c.name}", Status: "${c.status}", OwnerEmail: "${c.ownerEmail}"`);
  });

  const users = await User.find({ role: 'company-admin' });
  console.log('--- COMPANY ADMINS ---');
  users.forEach(u => {
    console.log(`ID: ${u._id}, Name: "${u.name}", Email: "${u.email}", CompanyId: "${u.companyId}"`);
  });

  mongoose.connection.close();
}

main().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
