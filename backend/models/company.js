const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a company name'],
    trim: true,
  },
  ownerName: { type: String, trim: true, default: '' },
  ownerEmail: {
    type: String,
    required: [true, 'Please provide an owner email'],
    trim: true,
    lowercase: true,
  },
  mobile:  { type: String, trim: true, default: '' },

  // ── KYC / Legal Documents ──────────────────────────────────────
  aadharNumber: { type: String, trim: true, default: '' },
  aadharDoc:    { type: String, default: '' },   // stored file path
  panNumber:    { type: String, trim: true, default: '' },
  panDoc:       { type: String, default: '' },   // stored file path
  gstNumber:    { type: String, trim: true, default: '' },
  gstDoc:       { type: String, default: '' },   // stored file path
  // ──────────────────────────────────────────────────────────────

  address: { type: String, trim: true, default: '' },
  city:    { type: String, trim: true, default: '' },
  state:   { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },

  status: {
    type: String,
    enum: ['pending_approval', 'active', 'suspended', 'expired'],
    default: 'pending_approval',
  },
  subscriptionPrice: {
    type: Number,
    required: true,
    default: 2999,
  },
  subscriptionExpiry: {
    type: Date,
    required: true,
    default: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; },
  },
  commissionRate: {
    type: Number,
    required: true,
    default: 10,
  },
  logoUrl: {
    type: String,
    default: '',
  },
  onboardedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Company', companySchema);
