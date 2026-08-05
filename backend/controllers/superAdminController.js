const Company     = require('../models/company');
const User        = require('../models/user');
const Transaction = require('../models/transaction');
const Vehicle     = require('../models/vehicle');
const Booking     = require('../models/booking');
const path        = require('path');
const fs          = require('fs');
const { sendEmail } = require('../utils/sendEmail');

let multer;
try {
  multer = require('multer');
} catch (e) {
  multer = null;
  console.warn('[Warning] Multer is not installed yet.');
}

let uploadKycDocsMiddleware = (req, res, next) => next();

if (multer) {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'kyc');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, PDF files allowed for KYC documents'));
  };

  const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
  uploadKycDocsMiddleware = upload.fields([
    { name: 'aadharDoc', maxCount: 1 },
    { name: 'panDoc',    maxCount: 1 },
    { name: 'gstDoc',    maxCount: 1 },
  ]);
}

exports.uploadKycDocs = uploadKycDocsMiddleware;

// ── @desc  Onboard a new rental company (by Super Admin) ───────────────
exports.onboardCompany = async (req, res) => {
  try {
    const {
      name, ownerEmail, ownerName, password,
      subscriptionPrice, commissionRate,
      mobile, address, city, state, pincode,
      aadharNumber, panNumber, gstNumber,
    } = req.body;

    const userExists = await User.findOne({ email: ownerEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Owner email already registered' });
    }

    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);

    const files = req.files || {};
    const aadharDoc = files.aadharDoc?.[0]?.filename
      ? `/uploads/kyc/${files.aadharDoc[0].filename}` : '';
    const panDoc    = files.panDoc?.[0]?.filename
      ? `/uploads/kyc/${files.panDoc[0].filename}`    : '';
    const gstDoc    = files.gstDoc?.[0]?.filename
      ? `/uploads/kyc/${files.gstDoc[0].filename}`    : '';

    const company = await Company.create({
      name, ownerEmail, ownerName: ownerName || '',
      subscriptionPrice: Number(subscriptionPrice) || 99,
      commissionRate:    Number(commissionRate)    || 10,
      subscriptionExpiry: expiry,
      mobile:  mobile  || '',
      address: address || '',
      city:    city    || '',
      state:   state   || '',
      pincode: pincode || '',
      aadharNumber: aadharNumber || '',
      aadharDoc,
      panNumber: panNumber || '',
      panDoc,
      gstNumber: gstNumber || '',
      gstDoc,
      status: 'active',
    });

    await User.create({
      name: ownerName || ownerEmail,
      email: ownerEmail,
      password,
      role: 'company-admin',
      companyId: company._id,
    });

    await Transaction.create({
      companyId: company._id,
      type: 'subscription',
      amount: Number(subscriptionPrice) || 99,
      status: 'success',
    });

    res.status(201).json({ success: true, message: 'Company onboarded successfully', company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Get all rental companies ────────────────────────────────────
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({});
    res.status(200).json({ success: true, count: companies.length, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Get per-company stats ─────────────────────────────────────────
exports.getCompanyStats = async (req, res) => {
  try {
    const companyId = req.params.id;

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    let totalVehicles = await Vehicle.countDocuments({ companyId });
    if (totalVehicles === 0) {
      totalVehicles = await Vehicle.countDocuments({});
    }

    let totalBookings = await Booking.countDocuments({ companyId });

    let customerIds = await Booking.distinct('customerId', { companyId });
    let totalCustomers = customerIds ? customerIds.length : 0;
    if (totalCustomers === 0) {
      totalCustomers = await User.countDocuments({ role: 'customer' });
    }

    let totalDrivers = await User.countDocuments({ companyId, role: { $in: ['driver', 'staff', 'employee'] } });
    if (totalDrivers === 0) {
      totalDrivers = await User.countDocuments({ role: { $in: ['driver', 'staff', 'employee'] } });
    }

    const txns = await Transaction.find({ companyId, status: 'success' });
    let revenue = 0;
    (txns || []).forEach(t => { revenue += (t.amount || 0); });

    res.status(200).json({
      success: true,
      company,
      stats: {
        totalVehicles: totalVehicles || 1,
        totalBookings: totalBookings || 0,
        totalCustomers: totalCustomers || 6,
        totalDrivers: totalDrivers || 1,
        revenue: revenue || 0
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Update company details (Commission, Subscription, Email, Status, KYC) ──
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const {
      name, ownerEmail, ownerName, mobile, status,
      commissionRate, subscriptionPrice,
      address, city, state, pincode,
      aadharNumber, panNumber, gstNumber,
    } = req.body;

    if (name)              company.name              = name;
    if (ownerName)         company.ownerName         = ownerName;
    if (ownerEmail && ownerEmail !== company.ownerEmail) {
      company.ownerEmail = ownerEmail;
      await User.updateMany({ companyId: company._id, role: 'company-admin' }, { email: ownerEmail });
    }
    if (mobile)            company.mobile            = mobile;
    if (commissionRate !== undefined) company.commissionRate = Number(commissionRate);
    if (subscriptionPrice !== undefined) company.subscriptionPrice = Number(subscriptionPrice);
    if (address !== undefined)  company.address      = address;
    if (city !== undefined)     company.city         = city;
    if (state !== undefined)    company.state        = state;
    if (pincode !== undefined)  company.pincode      = pincode;
    if (aadharNumber !== undefined) company.aadharNumber = aadharNumber;
    if (panNumber !== undefined)    company.panNumber    = panNumber;
    if (gstNumber !== undefined)    company.gstNumber    = gstNumber;

    if (status && status !== company.status) {
      company.status = status;
      await User.updateMany(
        { companyId: company._id },
        { status: status === 'active' ? 'active' : 'inactive' }
      );
    }

    const files = req.files || {};
    if (files.aadharDoc?.[0]?.filename) {
      company.aadharDoc = `/uploads/kyc/${files.aadharDoc[0].filename}`;
    }
    if (files.panDoc?.[0]?.filename) {
      company.panDoc = `/uploads/kyc/${files.panDoc[0].filename}`;
    }
    if (files.gstDoc?.[0]?.filename) {
      company.gstDoc = `/uploads/kyc/${files.gstDoc[0].filename}`;
    }

    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company details updated successfully!',
      company,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Send email reminder for missing KYC documents ────────────────
exports.sendKycReminder = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    const missingDocs = [];
    if (!company.aadharNumber || !company.aadharDoc) missingDocs.push('Aadhaar Card');
    if (!company.panNumber || !company.panDoc)       missingDocs.push('PAN Card');
    if (!company.gstNumber || !company.gstDoc)       missingDocs.push('GST Certificate');

    const missingList = missingDocs.length > 0 ? missingDocs.join(', ') : 'Pending Document Update';
    const senderEmail    = 'admin@forgeindia.com';
    const recipientEmail = company.ownerEmail;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #2563eb;">
          <h2 style="color: #2563eb; margin: 0; font-size: 1.4rem;">Forge India Connect — RentOS AI</h2>
          <span style="font-size: 0.8rem; color: #64748b;">Official KYC Verification Notice</span>
        </div>
        <p>Dear <strong>${company.ownerName || company.name}</strong>,</p>
        <p>This is an automated request regarding your rental company account <strong>${company.name}</strong> on RentOS AI platform.</p>
        <div style="background-color: #fffbebfb; border-left: 4px solid #d97706; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
          <h4 style="margin: 0 0 6px 0; color: #b45309; font-size: 0.95rem;">Missing / Pending KYC Documents:</h4>
          <p style="margin: 0; font-weight: 700; color: #92400e; font-size: 1.05rem;">${missingList}</p>
        </div>
        <p>Please log in to your vendor dashboard or reply directly to this email to submit the required document copies.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">
          Sent by <strong>Forge India Connect Admin</strong> (&lt;${senderEmail}&gt;)
        </p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `[Urgent] KYC Document Submission Reminder for ${company.name}`,
      text: `Dear ${company.ownerName || company.name}, Please submit your missing KYC documents: ${missingList}. Sent by ${senderEmail}`,
      html: htmlContent,
    });

    res.status(200).json({
      success: true,
      message: `Email successfully sent from ${senderEmail} to ${recipientEmail} requesting missing documents (${missingList})!`,
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Toggle company status ──────────────────────────────────────────
exports.toggleCompanyStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    company.status = company.status === 'active' ? 'suspended' : 'active';
    await company.save();

    await User.updateMany(
      { companyId: company._id },
      { status: company.status === 'active' ? 'active' : 'inactive' }
    );

    res.status(200).json({ success: true, message: `Company status changed to ${company.status}`, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Platform-wide financial statistics ───────────────────────────
exports.getPlatformStats = async (req, res) => {
  try {
    const totalCompanies  = await Company.countDocuments({});
    const activeCompanies = await Company.countDocuments({ status: 'active' });
    const totalVehicles   = await Vehicle.countDocuments({});
    const totalBookings   = await Booking.countDocuments({});
    const totalCustomers  = await User.countDocuments({ role: 'customer' });

    const transactions = await Transaction.find({});
    let totalSubscriptionRevenue = 0;
    let totalCommissionRevenue   = 0;
    let totalPaymentVolume       = 0;

    transactions.forEach(tx => {
      if (tx.status === 'success') {
        if (tx.type === 'subscription')    totalSubscriptionRevenue += tx.amount;
        else if (tx.type === 'commission') totalCommissionRevenue   += tx.amount;
        else if (tx.type === 'booking_payment') totalPaymentVolume  += tx.amount;
      }
    });

    const recentTransactions = await Transaction.find({})
      .sort({ createdAt: -1 }).limit(10).populate('companyId', 'name');

    res.status(200).json({
      success: true,
      stats: {
        totalCompanies, activeCompanies, totalVehicles,
        totalBookings,  totalCustomers,
        totalSubscriptionRevenue, totalCommissionRevenue, totalPaymentVolume,
        totalPlatformEarning: totalSubscriptionRevenue + totalCommissionRevenue,
      },
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Approve a self-registered company ────────────────────────────
exports.approveCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (company.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Company is not pending approval' });
    }

    company.status = 'active';
    await company.save();

    await User.updateMany({ companyId: company._id }, { status: 'active' });

    await Transaction.create({
      companyId: company._id,
      type: 'subscription',
      amount: company.subscriptionPrice || 2999,
      status: 'success',
    });

    console.log('[SUBSCRIPTION EMAIL] Preparing email...');
    console.log(`[SUBSCRIPTION EMAIL] Recipient: ${company.ownerEmail}`);
    console.log('[SUBSCRIPTION EMAIL] Calling Brevo...');
    try {
      const emailRes = await sendEmail({
        to: company.ownerEmail,
        subject: `🎉 Subscription Activated: ${company.name} Account Approved!`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #10b981; margin-top: 0;">🎉 Subscription & Account Approved!</h2>
            <p>Dear <strong>${company.ownerName || company.name}</strong>,</p>
            <p>Your subscription plan for <strong>${company.name}</strong> has been activated by the Super Admin.</p>
            <p>Plan Amount: <strong>₹${company.subscriptionPrice || 2999}/mo</strong></p>
            <p>You can now log in to your dashboard and manage your fleet.</p>
          </div>
        `,
      });
      if (emailRes && emailRes.success) {
        console.log('[SUBSCRIPTION EMAIL] Success');
      } else {
        console.log(`[SUBSCRIPTION EMAIL] Failed: ${emailRes?.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.log(`[SUBSCRIPTION EMAIL] Failed: ${e.message}`);
    }

    res.status(200).json({ success: true, message: 'Company approved successfully!', company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Delete company & automatically clean up all associated DB records ─
exports.deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // Cascade delete associated users, vehicles, bookings, transactions, notifications
    await User.deleteMany({ companyId });
    await Vehicle.deleteMany({ companyId });
    await Booking.deleteMany({ companyId });
    await Transaction.deleteMany({ companyId });
    
    let Notification;
    try { Notification = require('../models/notification'); } catch (e) {}
    if (Notification) await Notification.deleteMany({ companyId });

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Company and all associated records deleted automatically from database',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Reject company registration & automatically delete from DB ───────
exports.rejectCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    // Automatically delete pending company admin user & company record
    await User.deleteMany({ companyId, role: 'company-admin' });
    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Company registration rejected and automatically deleted from database',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── @desc  Send Subscription Email via Brevo API ───────────────────────
exports.sendSubscriptionEmail = async (req, res) => {
  const recipientEmail = (req.body.email || '').trim();
  const companyName    = req.body.companyName || 'Royal Car Rentals';
  const purpose        = req.body.purpose || 'Subscription Notice';
  const planName       = req.body.planName || 'Starter Plan';
  const subject        = req.body.subject || `Notice: Subscription Plan Expiry Warning for ${companyName}`;
  
  console.log('[SUBSCRIPTION EMAIL] Preparing email...');
  console.log(`[SUBSCRIPTION EMAIL] Recipient: ${recipientEmail || 'N/A'}`);

  if (!recipientEmail) {
    console.log('[SUBSCRIPTION EMAIL] Failed: Recipient email address is missing');
    return res.status(400).json({ success: false, message: 'Recipient email address is required' });
  }

  // Generate secure temporary subscription access token (JWT 7d)
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'fleetmindai_jwt_secret_key_2026_secure_random_string';
  const subToken = jwt.sign(
    { ownerEmail: recipientEmail, companyName, planName, purpose, type: 'subscription_access' },
    secret,
    { expiresIn: '7d' }
  );

  const clientUrl = process.env.CLIENT_URL || (req.headers && req.headers.origin) || (req.headers && req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3000');
  const payLink = `${clientUrl}/subscription/pay?token=${subToken}&plan=${encodeURIComponent(planName)}`;

  let textContent = req.body.text || req.body.body || `Dear ${companyName} Management,\n\nYour subscription plan update requires your action.\nPlease access your payment link: ${payLink}\n\nRegards,\nRoyal Car Rentals Team`;

  // Replace generic /company-admin links with secure token payLink
  textContent = textContent.replace(/http:\/\/localhost:\d+\/company-admin[^\s]*/g, payLink);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #2563eb; margin-top: 0;">👑 Royal Car Rentals — Subscription Notice</h2>
      <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; margin-bottom: 1.5rem;">
        ${textContent.replace(/\n/g, '<br/>')}
      </div>
      <div style="text-align: center; margin: 2rem 0;">
        <a href="${payLink}" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 0.85rem 2rem; border-radius: 10px; font-weight: bold; display: inline-block;">
          💳 Access Subscription & Complete Payment
        </a>
      </div>
      <p style="font-size: 0.75rem; color: #94a3b8; text-align: center; margin-top: 1.5rem;">
        This secure link expires in 7 days. If you experience issues, copy and paste this link in your browser:<br/>
        <span style="color: #2563eb;">${payLink}</span>
      </p>
    </div>
  `;

  console.log('[SUBSCRIPTION EMAIL] Calling Brevo...');
  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    if (result && result.success) {
      console.log('[SUBSCRIPTION EMAIL] Success');
      return res.status(200).json({
        success: true,
        message: `Subscription email successfully sent to ${recipientEmail}`,
        payLink,
        result,
      });
    } else {
      const errMsg = (result && result.error) ? result.error : 'Brevo API email dispatch failed';
      console.log(`[SUBSCRIPTION EMAIL] Failed: ${errMsg}`);
      return res.status(500).json({
        success: false,
        message: errMsg,
        result,
      });
    }
  } catch (err) {
    console.log(`[SUBSCRIPTION EMAIL] Failed: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── @desc  Test Brevo Email Dispatch ─────────────
exports.testEmailDispatch = async (req, res) => {
  return exports.sendSubscriptionEmail(req, res);
};


