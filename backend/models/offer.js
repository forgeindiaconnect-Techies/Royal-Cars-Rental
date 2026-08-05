const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  description: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a company cannot have duplicate active/inactive codes
offerSchema.index({ companyId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Offer', offerSchema);
