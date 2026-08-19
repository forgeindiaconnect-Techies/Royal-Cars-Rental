const mongoose = require('mongoose');

const scheduledEmailSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  recipientName: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    required: true,
  },
  html: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
  },
  relatedType: {
    type: String,
    enum: ['booking', 'duty', 'notification', 'subscription', 'custom'],
    default: 'custom',
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  sentAt: {
    type: Date,
    default: null,
  },
  error: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast query of pending emails that are due
scheduledEmailSchema.index({ status: 1, scheduledTime: 1 });

module.exports = mongoose.model('ScheduledEmail', scheduledEmailSchema);
