import connectDB from '../../../utils/db';
import User from '../../../models/User';
import ImageGeneration from '../../../models/ImageGeneration';
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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get total users
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingUsers = await User.countDocuments({ role: 'user', status: 'pending' });
    const approvedUsers = await User.countDocuments({ role: 'user', status: 'approved' });
    const rejectedUsers = await User.countDocuments({ role: 'user', status: 'rejected' });

    // Get total images generated
    const totalImagesResult = await ImageGeneration.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$imagesCount' } } },
    ]);
    const totalImagesGenerated = totalImagesResult[0]?.total || 0;

    // Get total generations count
    const totalGenerations = await ImageGeneration.countDocuments({ status: 'success' });

    // Get users with most images generated
    const topUsers = await User.aggregate([
      { $match: { role: 'user' } },
      { $sort: { imagesGenerated: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: 1,
          email: 1,
          imagesGenerated: 1,
          imageLimit: 1,
          status: 1,
        },
      },
    ]);

    // Get daily stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await ImageGeneration.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: '$imagesCount' },
          generations: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get recent activity
    const recentGenerations = await ImageGeneration.find({ status: 'success' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId imagesCount createdAt');

    res.status(200).json({
      users: {
        total: totalUsers,
        pending: pendingUsers,
        approved: approvedUsers,
        rejected: rejectedUsers,
      },
      images: {
        totalGenerated: totalImagesGenerated,
        totalGenerations: totalGenerations,
      },
      topUsers,
      dailyStats,
      recentGenerations,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default handler;

