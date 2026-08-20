const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'driver', 'system'],
    default: 'customer'
  },
  purpose: {
    type: String,
    enum: ['BOOKING_VERIFICATION', 'CASH_COLLECTION', 'TRIP_START', 'AUTH_VERIFICATION'],
    required: true
  },
  bookingId: {
    type: String,
    default: ''
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index on email + purpose + bookingId
otpSchema.index({ email: 1, purpose: 1, bookingId: 1 });

// TTL index to automatically purge expired records
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
