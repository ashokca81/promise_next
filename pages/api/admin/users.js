import connectDB from '../../../utils/db';
import User from '../../../models/User';
import { getTokenFromRequest, verifyToken } from '../../../utils/auth';

async function handler(req, res) {
  try {
    // Apply auth middleware
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await connectDB();
    const authUser = await User.findById(decoded.userId).select('-password');
    if (!authUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (authUser.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }

    req.user = authUser;

    if (req.method === 'GET') {
          // Get all users
          const { status, search } = req.query;
          
          let query = {};
          if (status) {
            query.status = status;
          }
          if (search) {
            query.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ];
          }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .populate('approvedBy', 'name email');

      // Convert _id to id for frontend
      const usersWithId = users.map(user => ({
        ...user.toObject(),
        id: user._id.toString(),
      }));

      res.status(200).json({ users: usersWithId });
    } else if (req.method === 'PUT') {
      // Update user (approve/reject/set limit)
      const { userId, action, imageLimit } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (action === 'approve') {
        user.status = 'approved';
        user.approvedAt = new Date();
        user.approvedBy = req.user._id;
      } else if (action === 'reject') {
        user.status = 'rejected';
      } else if (action === 'setLimit') {
        if (typeof imageLimit !== 'number' || imageLimit < 0) {
          return res.status(400).json({ error: 'Valid image limit is required' });
        }
        user.imageLimit = imageLimit;
      } else if (action === 'resetUsage') {
        user.imagesGenerated = 0;
      }

      await user.save();

      const userResponse = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        imageLimit: user.imageLimit,
        imagesGenerated: user.imagesGenerated,
        approvedAt: user.approvedAt,
      };

      res.status(200).json({
        message: 'User updated successfully',
        user: userResponse,
      });
    } else if (req.method === 'DELETE') {
      // Delete user
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      if (userId === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await User.findByIdAndDelete(userId);

      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin users API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;

