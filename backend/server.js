const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded KYC documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/brain-assets', express.static('C:/Users/Forgeindiaconnect/.gemini/antigravity-ide/brain/0691647b-4c11-4fe4-8142-bb31dd99e0d1'));


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/super-admin', require('./routes/superAdminRoutes'));
app.use('/api/company-admin', require('./routes/companyAdminRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));

// Root / Health check Route
app.get('/', (req, res) => {
  res.json({ status: 'healthy', project: 'RentOS AI API', version: '1.0.0' });
});

// Custom Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Error Middleware] ${err.message}`);
  res.status(200).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Restart triggered to apply Location schema updates');
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Start Automated Daily Subscription Expiry Check Cron Job
  try {
    const Company = require('./models/company');
    const { startSubscriptionCron } = require('./utils/subscriptionScheduler');

    startSubscriptionCron(Company);
    console.log('🔄 Brevo Email & Subscription Expiry Cron Scheduler Active');
  } catch (cronErr) {
    console.warn('Subscription cron init note:', cronErr.message);
  }
});
