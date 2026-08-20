const Location = require('../models/location');
const Vehicle = require('../models/vehicle');

// @desc    Get all locations with dynamic car count
// @route   GET /api/locations
// @access  Public
exports.getLocations = async (req, res) => {
  try {
    let locations = await Location.find().sort({ displayOrder: 1 });
    
    // Auto-seed default regional hub locations if database has zero locations
    if (locations.length === 0) {
      const defaultHubs = [
        { name: 'Guntalpatty / Krishnagiri', state: 'Tamil Nadu', country: 'India', shortDescription: 'Primary Regional Fleet Hub & Highway Service Desk', featured: true, displayOrder: 1, carsCount: 15, imageUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800', status: 'active' },
        { name: 'Dharmapuri', state: 'Tamil Nadu', country: 'India', shortDescription: 'State Highway Terminal & District Pickup Desk', featured: true, displayOrder: 2, carsCount: 10, imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800', status: 'active' },
        { name: 'Hosur', state: 'Tamil Nadu', country: 'India', shortDescription: 'Industrial Border Terminal & Tech Park Delivery Point', featured: true, displayOrder: 3, carsCount: 12, imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', status: 'active' },
        { name: 'Salem', state: 'Tamil Nadu', country: 'India', shortDescription: 'Central Junction Hub & Chauffeur Express Terminal', featured: false, displayOrder: 4, carsCount: 8, imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', status: 'active' },
        { name: 'Bengaluru / Bangalore', state: 'Karnataka', country: 'India', shortDescription: 'Interstate Airport & Tech Corridor Hub', featured: true, displayOrder: 5, carsCount: 20, imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800', status: 'active' },
        { name: 'Chennai Airport & Central', state: 'Tamil Nadu', country: 'India', shortDescription: 'Metropolitan Terminal & Express Coastal Fleet Hub', featured: true, displayOrder: 6, carsCount: 18, imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800', status: 'active' },
        { name: 'Coimbatore', state: 'Tamil Nadu', country: 'India', shortDescription: 'Western Gateway & Hills Connectivity Hub', featured: false, displayOrder: 7, carsCount: 9, imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800', status: 'active' },
        { name: 'Pondicherry / Puducherry', state: 'Union Territory', country: 'India', shortDescription: 'Coastal Tourist Rental Desk & Beach Terminal', featured: true, displayOrder: 8, carsCount: 11, imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800', status: 'active' },
        { name: 'Madurai', state: 'Tamil Nadu', country: 'India', shortDescription: 'Southern Junction & Temple City Rental Hub', featured: false, displayOrder: 9, carsCount: 7, imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800', status: 'active' }
      ];

      await Location.insertMany(defaultHubs);
      locations = await Location.find().sort({ displayOrder: 1 });
    }
    
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
