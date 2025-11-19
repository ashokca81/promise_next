import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { getTokenFromRequest, verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is approved (superadmin can always access)
    if (user.role === 'user' && user.status !== 'approved') {
      return res.status(403).json({
        error: 'Account pending approval',
        status: user.status,
      });
    }

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      imageLimit: user.imageLimit,
      imagesGenerated: user.imagesGenerated,
    };

    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

