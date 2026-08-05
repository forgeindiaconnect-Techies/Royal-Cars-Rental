const mongoose = require('mongoose');
const dns = require('dns');

// Configure custom DNS servers only if requested, otherwise use default OS resolver.
// In this environment, custom DNS (8.8.8.8) is blocked or failing, so we use the system DNS.
/*
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('DNS servers configured to 8.8.8.8 and 1.1.1.1 for MongoDB SRV resolution.');
} catch (dnsErr) {
  console.warn('Failed to set custom DNS servers:', dnsErr.message);
}
*/

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not defined in the environment variables (.env file).');
    process.exit(1);
  }

  try {
    console.log('Connecting to primary MongoDB (Cloud Atlas)...');
    // Set 8 seconds selection timeout so it doesn't hang indefinitely if blocked
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Cloud MongoDB connection failed: ${error.message}`);
    
    // Check if the URI is a cloud MongoDB Atlas URI (either srv or standard listing)
    const isCloudUri = mongoUri.startsWith('mongodb+srv://') || mongoUri.includes('.mongodb.net');
    
    if (isCloudUri) {
      console.log('\n⚠️  Troubleshooting Cloud MongoDB Connection:');
      console.log('1. IP WHITELIST: Please ensure your current IP address is whitelisted in your MongoDB Atlas dashboard (Network Access -> Add IP Address -> Allow Access from Anywhere: 0.0.0.0/0).');
      console.log('2. PASSWORD/USERNAME: Verify that the credentials in MONGO_URI in backend/.env are correct.');
      console.log('3. NETWORK/FIREWALL: Ensure your network allows outbound connections on port 27017 and port 53 (DNS).\n');
      
      // Since user requested not to store in local, do not fall back to local database
      console.log('🚫 Skipping local MongoDB fallback as requested (only Cloud MongoDB should be used).');
    } else {
      console.log('Attempting fallback to Local MongoDB (127.0.0.1:27017)...');
      try {
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/fleetmind-ai', {
          serverSelectionTimeoutMS: 5000
        });
        console.log(`MongoDB Connected successfully (Local Fallback): ${conn.connection.host}`);
      } catch (localErr) {
        console.error(`Fallback database connection also failed: ${localErr.message}`);
        console.log('⚠️ Please ensure local MongoDB service is running (mongod) or primary database is accessible.');
      }
    }
  }
};

module.exports = connectDB;
