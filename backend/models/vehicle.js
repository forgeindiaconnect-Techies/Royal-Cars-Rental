const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  make: {
    type: String,
    required: [true, 'Please provide the make (brand)'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Please provide the model'],
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    default: 2024,
  },
  category: {
    type: String,
    required: true,
    default: 'Sedan',
  },
  pricePerDay: {
    type: Number,
    required: true,
    default: 2000,
  },
  regNumber: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance'],
    default: 'available',
  },
  specs: {
    fuel: {
      type: String,
      default: 'Petrol',
    },
    transmission: {
      type: String,
      default: 'Manual',
    },
    seats: {
      type: Number,
      default: 5,
    },
    luggage: {
      type: Number,
      default: 2,
    },
  },
  features: [String],
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400',
  },
  galleryImages: {
    type: [String],
    default: [],
  },
  insurance: {
    policyUrl: { type: String, default: '' },
    expiryDate: { type: String, default: '' },
    isVerified: { type: Boolean, default: true },
  },
  location: {
    type: String,
    default: 'Chennai Main Branch',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
