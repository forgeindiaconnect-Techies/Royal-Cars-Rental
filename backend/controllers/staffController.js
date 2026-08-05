const Booking = require('../models/booking');
const Vehicle = require('../models/vehicle');

// @desc    Get all bookings for the staff's company
// @route   GET /api/staff/bookings
// @access  Private/Employee
exports.getCompanyBookings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const bookings = await Booking.find({ companyId })
      .populate('vehicleId')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify or reject booking documents
// @route   PUT /api/staff/bookings/:id/verify
// @access  Private/Employee
exports.verifyDocuments = async (req, res) => {
  try {
    const { status, remarks } = req.body; // status is 'verified' or 'rejected'
    const companyId = req.user.companyId;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    booking.documentStatus = status === 'verified' ? 'verified' : 'rejected';
    
    // Automatically approve booking if documents are verified
    if (status === 'verified') {
      booking.status = 'approved';
    } else {
      booking.status = 'cancelled';
    }
    
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Documents verification marked as ${status}. Booking status updated.`,
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Hand over vehicle (Checkout)
// @route   PUT /api/staff/bookings/:id/checkout
// @access  Private/Employee
exports.checkoutVehicle = async (req, res) => {
  try {
    const { checkOutNotes } = req.body;
    const companyId = req.user.companyId;

    const booking = await Booking.findById(req.params.id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Booking must be approved (and docs verified) before checkout' });
    }

    // Update booking
    booking.status = 'active';
    booking.checkOutNotes = checkOutNotes || 'Handed over in good condition';
    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicleId._id, { status: 'rented' });

    res.status(200).json({ success: true, message: 'Vehicle successfully checked out', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Receive vehicle return (Checkin)
// @route   PUT /api/staff/bookings/:id/checkin
// @access  Private/Employee
exports.checkinVehicle = async (req, res) => {
  try {
    const { checkInNotes } = req.body;
    const companyId = req.user.companyId;

    const booking = await Booking.findById(req.params.id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this booking' });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Booking is not currently active' });
    }

    // Update booking
    booking.status = 'completed';
    booking.checkInNotes = checkInNotes || 'Returned in good condition';
    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicleId._id, { status: 'available' });

    res.status(200).json({ success: true, message: 'Vehicle successfully returned and checked in', booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
