const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Configure custom DNS servers to ensure MongoDB Atlas SRV records resolve properly on all networks.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('Failed to set custom DNS servers:', dnsErr.message);
}

const User = require('../models/user');
const Company = require('../models/company');
const Vehicle = require('../models/vehicle');
const Booking = require('../models/booking');
const Transaction = require('../models/transaction');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to Mongo
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fleetmind-ai');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Vehicle.deleteMany({});
    await Booking.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Database cleared.');

    // 1. Create Super Admin (Platform Owner)
    const superAdmin = await User.create({
      name: 'Forge India Admin',
      email: 'admin@forgeindia.com',
      password: 'password123', // Hashing is handled by User pre-save middleware
      role: 'super-admin',
    });
    console.log('Super admin created: admin@forgeindia.com / password123');

    // 2. Create Companies
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const company1 = await Company.create({
      name: 'IndiDrive Rentals',
      ownerName: 'Rohan Sharma',
      ownerEmail: 'owner@indidrive.com',
      mobile: '9876543210',
      address: 'A-12 Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      status: 'active',
      subscriptionPrice: 2999,
      commissionRate: 10,
      subscriptionExpiry: nextMonth,
    });

    const company2 = await Company.create({
      name: 'Himalayan Cruisers',
      ownerName: 'Tenzing Norgay',
      ownerEmail: 'owner@himalayan.com',
      mobile: '9876543211',
      address: 'Mall Road Near Main Square',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
      status: 'active',
      subscriptionPrice: 2999,
      commissionRate: 12,
      subscriptionExpiry: nextMonth,
    });
    console.log('Companies created.');

    // 3. Create Company Admins (Managers)
    const admin1 = await User.create({
      name: 'Rohan Sharma',
      email: 'owner@indidrive.com',
      password: 'password123',
      role: 'company-admin',
      companyId: company1._id,
    });

    const admin2 = await User.create({
      name: 'Tenzing Norgay',
      email: 'owner@himalayan.com',
      password: 'password123',
      role: 'company-admin',
      companyId: company2._id,
    });
    console.log('Company Admins created.');

    // 4. Create Staff/Employees
    const employee1 = await User.create({
      name: 'Amit Patel',
      email: 'amit@indidrive.com',
      password: 'password123',
      role: 'employee',
      companyId: company1._id,
    });

    const employee2 = await User.create({
      name: 'Sonam Wangchuk',
      email: 'sonam@himalayan.com',
      password: 'password123',
      role: 'employee',
      companyId: company2._id,
    });
    console.log('Company Employees created.');

    // 5. Create Customer
    const customer = await User.create({
      name: 'Rahul Kumar',
      email: 'rahul@gmail.com',
      password: 'password123',
      role: 'customer',
    });
    console.log('Customer created: rahul@gmail.com / password123');

    // 6. Create Vehicles
    // Company 1 (IndiDrive - Delhi based)
    const swift = await Vehicle.create({
      companyId: company1._id,
      make: 'Maruti Suzuki',
      model: 'Swift',
      year: 2024,
      category: 'Hatchback',
      pricePerDay: 35,
      status: 'available',
      specs: {
        fuel: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        luggage: 2,
      },
      features: ['Bluetooth Audio', 'Reverse Camera', 'ABS'],
      imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400',
      location: 'Delhi',
    });

    const xuv700 = await Vehicle.create({
      companyId: company1._id,
      make: 'Mahindra',
      model: 'XUV700',
      year: 2024,
      category: 'SUV',
      pricePerDay: 75,
      status: 'available',
      specs: {
        fuel: 'Diesel',
        transmission: 'Automatic',
        seats: 7,
        luggage: 4,
      },
      features: ['Sunroof', 'ADAS Auto Pilot', 'Leather Seats', 'All-Wheel Drive'],
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400',
      location: 'Delhi',
    });

    const nexonEV = await Vehicle.create({
      companyId: company1._id,
      make: 'Tata',
      model: 'Nexon EV',
      year: 2023,
      category: 'Electric',
      pricePerDay: 50,
      status: 'available',
      specs: {
        fuel: 'Electric',
        transmission: 'Automatic',
        seats: 5,
        luggage: 3,
      },
      features: ['Smart Charger Pack', 'Regenerative Braking', 'Touchscreen Infotainment'],
      imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=400',
      location: 'Delhi',
    });

    // Company 2 (Himalayan Cruisers - Manali / Chandigarh based)
    const fortuner = await Vehicle.create({
      companyId: company2._id,
      make: 'Toyota',
      model: 'Fortuner',
      year: 2024,
      category: 'SUV',
      pricePerDay: 90,
      status: 'available',
      specs: {
        fuel: 'Diesel',
        transmission: 'Manual',
        seats: 7,
        luggage: 5,
      },
      features: ['4x4 Offroad Lock', 'Hill Descent Control', 'Roof Carrier', 'High Ground Clearance'],
      imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400',
      location: 'Manali',
    });

    const bmw = await Vehicle.create({
      companyId: company2._id,
      make: 'BMW',
      model: '3 Series',
      year: 2023,
      category: 'Luxury',
      pricePerDay: 160,
      status: 'available',
      specs: {
        fuel: 'Petrol',
        transmission: 'Automatic',
        seats: 5,
        luggage: 3,
      },
      features: ['Harman Kardon Sound', 'Ambient Lighting', 'Heated Seats', 'Heads-up Display'],
      imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=400',
      location: 'Chandigarh',
    });
    console.log('Vehicles created.');

    // 7. Seed Transactions and Bookings (Create historical simulation)
    // - Create a past completed booking for swift (IndiDrive) by customer Rahul
    const pastStart = new Date();
    pastStart.setDate(pastStart.getDate() - 10);
    const pastEnd = new Date();
    pastEnd.setDate(pastEnd.getDate() - 7);

    const bookingCompleted = await Booking.create({
      customerId: customer._id,
      companyId: company1._id,
      vehicleId: swift._id,
      startDate: pastStart,
      endDate: pastEnd,
      totalAmount: 105, // 3 days * 35
      status: 'completed',
      paymentStatus: 'paid',
      documentStatus: 'verified',
      documentUrl: 'https://via.placeholder.com/600x400.png?text=Driver+License+Verified',
      checkOutNotes: 'All clear, standard scratches checked.',
      checkInNotes: 'Returned on time, full tank.',
    });

    // Logging completed transactions
    await Transaction.create({
      companyId: company1._id,
      bookingId: bookingCompleted._id,
      type: 'booking_payment',
      amount: 105,
      status: 'success',
    });

    await Transaction.create({
      companyId: company1._id,
      bookingId: bookingCompleted._id,
      type: 'commission',
      amount: 10.5, // 10% commission on $105
      status: 'success',
    });

    // - Create a subscription log for both companies
    await Transaction.create({
      companyId: company1._id,
      type: 'subscription',
      amount: 99,
      status: 'success',
    });

    await Transaction.create({
      companyId: company2._id,
      type: 'subscription',
      amount: 120,
      status: 'success',
    });

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
