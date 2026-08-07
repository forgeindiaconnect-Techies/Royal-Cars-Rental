const Location = require('../models/location');
const Vehicle = require('../models/vehicle');

// @desc    Get all locations with dynamic car count
// @route   GET /api/locations
// @access  Public
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ displayOrder: 1 });
    
    // Calculate car count for each location dynamically
    const locationsWithCounts = await Promise.all(
      locations.map(async (loc) => {
        const locDoc = loc.toObject();
        const dynamicCount = await Vehicle.countDocuments({
          status: 'available',
          location: { $regex: loc.name, $options: 'i' }
        });
        const finalCount = locDoc.carsCount > 0 ? locDoc.carsCount : dynamicCount;
        return { ...locDoc, carsCount: finalCount };
      })
    );

    res.status(200).json({ success: true, count: locationsWithCounts.length, data: locationsWithCounts });
  } catch (error) {
    console.error('Error in getLocations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new location
// @route   POST /api/locations
// @access  Private/SuperAdmin
exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create({ ...req.body, createdBy: req.user?.id });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error('Error in createLocation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a location
// @route   PUT /api/locations/:id
// @access  Private/SuperAdmin
exports.updateLocation = async (req, res) => {
  try {
    let location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: location });
  } catch (error) {
    console.error('Error in updateLocation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a location
// @route   DELETE /api/locations/:id
// @access  Private/SuperAdmin
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    await location.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error in deleteLocation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
