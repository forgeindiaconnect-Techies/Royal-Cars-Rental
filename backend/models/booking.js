const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'trip_accepted', 'in_progress', 'trip_finished', 'completed', 'cancelled'],
    default: 'pending',
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  documentStatus: {
    type: String,
    enum: ['unverified', 'pending_verification', 'verified', 'rejected'],
    default: 'unverified',
  },
  documentUrl: {
    type: String, // Base64 or local file path simulator URL
    default: '',
  },
  invoiceUrl: {
    type: String,
    default: '',
  },
  checkOutNotes: {
    type: String,
    default: '',
  },
  checkInNotes: {
    type: String,
    default: '',
  },
  hasDriver: {
    type: Boolean,
    default: false,
  },
  driverCost: {
    type: Number,
    default: 0,
  },
  documents: {
    aadhaarUrl: { type: String, default: '' },
    drivingLicenseUrl: { type: String, default: '' },
    panUrl: { type: String, default: '' },
    selfieUrl: { type: String, default: '' },
    addressProofUrl: { type: String, default: '' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
