import { getTokenFromRequest, verifyToken } from '../utils/auth';
import connectDB from '../utils/db';
import User from '../models/User';

export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
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

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireSuperadmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
}

