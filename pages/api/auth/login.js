import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { generateToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is approved (superadmin can always login)
    if (user.role === 'user' && user.status !== 'approved') {
      return res.status(403).json({
        error: 'Your account is pending approval. Please wait for admin approval.',
        status: user.status,
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Remove password from response
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      imageLimit: user.imageLimit,
      imagesGenerated: user.imagesGenerated,
    };

    // Set cookie
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

