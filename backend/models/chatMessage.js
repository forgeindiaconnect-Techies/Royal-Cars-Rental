const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    default: null,
  },
  receiverRole: {
    type: String,
    required: true,
  },
  companyId: {
    type: String,
    default: null,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
