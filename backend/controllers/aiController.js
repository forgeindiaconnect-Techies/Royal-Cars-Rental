const Vehicle = require('../models/vehicle');

// @desc    Get AI vehicle recommendations based on preferences
// @route   POST /api/ai/recommend
// @access  Public (or Private)
exports.getRecommendations = async (req, res) => {
  try {
    const { budgetPerDay, passengers, luggageBags, tripType, transmission } = req.body;

    // Validate input
    if (!passengers) {
      return res.status(400).json({ success: false, message: 'Please specify the number of passengers' });
    }

    // Retrieve all available vehicles from active companies
    const vehicles = await Vehicle.find({ status: 'available' }).populate('companyId', 'name status');
    
    // Filter active companies
    const activeVehicles = vehicles.filter(v => v.companyId && v.companyId.status === 'active');

    const recommendedList = activeVehicles.map(vehicle => {
      let score = 0;
      let reasons = [];

      // 1. Capacity Checks (Seats)
      if (vehicle.specs.seats >= Number(passengers)) {
        score += 25;
        if (vehicle.specs.seats === Number(passengers)) {
          score += 5; // Perfect seats match
        }
        reasons.push(`Comfortably seats your party of ${passengers} (${vehicle.specs.seats} seats available).`);
      } else {
        score -= 50; // Major penalty, not enough seats
      }

      // 2. Capacity Checks (Luggage)
      if (vehicle.specs.luggage >= Number(luggageBags || 0)) {
        score += 20;
        reasons.push(`Spacious trunk fits all your ${luggageBags || 0} luggage bag(s).`);
      } else {
        score += 5; // fits partial luggage
        reasons.push(`Warning: Luggage capacity (${vehicle.specs.luggage} bags) might be tight for your ${luggageBags} bags.`);
      }

      // 3. Price / Budget Matching
      if (budgetPerDay) {
        if (vehicle.pricePerDay <= Number(budgetPerDay)) {
          score += 25;
          reasons.push(`Inside your budget limit of $${budgetPerDay}/day (Costs $${vehicle.pricePerDay}/day).`);
        } else if (vehicle.pricePerDay <= Number(budgetPerDay) * 1.25) {
          score += 10;
          reasons.push(`Slightly above budget ($${vehicle.pricePerDay}/day) but offers excellent value.`);
        } else {
          score -= 10; // Over budget
        }
      } else {
        score += 20; // No budget constraint specified
      }

      // 4. Transmission Match
      if (transmission && transmission !== 'Any') {
        if (vehicle.specs.transmission.toLowerCase() === transmission.toLowerCase()) {
          score += 15;
          reasons.push(`Matches your transmission preference: ${vehicle.specs.transmission}.`);
        }
      } else {
        score += 10;
      }

      // 5. Trip Type Alignment
      if (tripType) {
        switch (tripType.toLowerCase()) {
          case 'business':
            if (vehicle.category === 'Luxury' || vehicle.category === 'Sedan') {
              score += 15;
              reasons.push(`Sophisticated ${vehicle.category} body style creates a premium professional image.`);
            }
            if (vehicle.specs.transmission === 'Automatic') {
              score += 5;
              reasons.push(`Automatic transmission enables stress-free city business commuting.`);
            }
            break;
          case 'family':
            if (vehicle.category === 'SUV') {
              score += 15;
              reasons.push(`Robust SUV build ensures safety and comfort for family drives.`);
            }
            if (vehicle.specs.seats >= 5) {
              score += 5;
            }
            break;
          case 'adventure':
            if (vehicle.category === 'SUV') {
              score += 15;
              reasons.push(`High ground clearance SUV suitable for varied routes and terrains.`);
            }
            if (vehicle.specs.fuel === 'Diesel' || vehicle.specs.fuel === 'Petrol') {
              score += 5;
              reasons.push(`Reliable fuel drivetrain ensures range confidence in remote areas.`);
            }
            break;
          case 'eco-friendly':
            if (vehicle.specs.fuel === 'Electric' || vehicle.specs.fuel === 'Hybrid') {
              score += 20;
              reasons.push(`Sustainable ${vehicle.specs.fuel} engine minimizes carbon footprint and fuel costs.`);
            } else {
              score -= 10;
            }
            break;
          default:
            break;
        }
      }

      // Constrain score between 0 and 100
      const finalScore = Math.max(0, Math.min(100, score));

      return {
        vehicle,
        matchScore: finalScore,
        reasons,
      };
    });

    // Filter out vehicles that fail seats capacity, and sort by score
    const filteredRecommendations = recommendedList
      .filter(item => item.matchScore >= 40) // Threshold score to recommend
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5); // Return top 5 matches

    res.status(200).json({
      success: true,
      count: filteredRecommendations.length,
      recommendations: filteredRecommendations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
