const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
  type: {
    type: String,
    enum: ['subscription', 'commission', 'booking_payment'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  platformFee: {
    type: Number,
    default: 0, // Commission amount collected by platform owner
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'failed'],
    default: 'success',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);
