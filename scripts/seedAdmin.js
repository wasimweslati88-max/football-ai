const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      accessCode: 'ADMIN_' + Date.now(),
      role: 'admin',
      name: 'Administrator',
      isActive: true
    });

    console.log('Admin user created successfully');
    console.log('Admin ID:', admin._id);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
