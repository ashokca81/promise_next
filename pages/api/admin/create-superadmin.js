// One-time superadmin creation API
// This allows creating superadmin without authentication
// Should be disabled after first admin is created

import connectDB from '../../../utils/db';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ role: 'superadmin' });
    if (existingAdmin) {
      return res.status(400).json({
        error: 'Superadmin already exists. Please login instead.',
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
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

    // Remove password from response
    const userResponse = {
      id: superadmin._id,
      name: superadmin.name,
      email: superadmin.email,
      role: superadmin.role,
    };

    res.status(201).json({
      message: 'Superadmin created successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Create superadmin error:', error);
    
    if (error.message.includes('authentication failed')) {
      return res.status(500).json({
        error: 'MongoDB connection failed. Please check your connection string in utils/db.js',
      });
    }
    
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

