// Script to create the first superadmin user
// Run: npm run create-admin [email] [password] [name]

import connectDB from '../utils/db.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const createSuperadmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Super Admin';

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ role: 'superadmin' });
    if (existingAdmin) {
      console.log('❌ Superadmin already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      process.exit(1);
    }

    // Create superadmin
    const superadmin = new User({
      name,
      email,
      password,
      role: 'superadmin',
      status: 'approved',
      imageLimit: 0, // Unlimited
    });

    await superadmin.save();

    console.log('✅ Superadmin created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Please change the password after first login!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createSuperadmin();

