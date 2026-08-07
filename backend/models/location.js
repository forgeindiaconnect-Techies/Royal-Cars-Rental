const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the location name'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'Please provide the state'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Please provide the country'],
    trim: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  shortDescription: {
    type: String,
    trim: true,
    default: '',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  carsCount: {
    type: Number,
    default: 0,
  },
  displayOrder: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Location', locationSchema);
