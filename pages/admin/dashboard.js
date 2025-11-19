import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authAPI, adminAPI } from '../../utils/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedTab, setSelectedTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [limitValue, setLimitValue] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      loadUsers();
      loadAnalytics();
    }
  }, [user, searchTerm, statusFilter]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await authAPI.verify();
      if (response.user.role !== 'superadmin') {
        router.push('/dashboard');
        return;
      }
      setUser(response.user);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await adminAPI.getUsers(params);
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await adminAPI.getAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleUserAction = async (userId, action, value = null) => {
    try {
      const data = { userId, action };
      if (value !== null) data.imageLimit = value;
      
      await adminAPI.updateUser(data);
      await loadUsers();
      await loadAnalytics();
      setEditingUser(null);
      setLimitValue('');
      alert('User updated successfully');
    } catch (error) {
      alert(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      await loadUsers();
      await loadAnalytics();
      alert('User deleted successfully');
    } catch (error) {
      alert(error.message || 'Failed to delete user');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Superadmin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setSelectedTab('users')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  selectedTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setSelectedTab('analytics')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  selectedTab === 'analytics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Limit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Generated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              u.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : u.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.imageLimit > 0 ? u.imageLimit : 'Unlimited'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.imagesGenerated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            {u.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUserAction(u.id, 'approve')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUserAction(u.id, 'reject')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {editingUser === u.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={limitValue}
                                  onChange={(e) => setLimitValue(e.target.value)}
                                  placeholder="Limit"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                  onClick={() => handleUserAction(u.id, 'setLimit', parseInt(limitValue))}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUser(null);
                                    setLimitValue('');
                                  }}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingUser(u.id);
                                    setLimitValue(u.imageLimit > 0 ? u.imageLimit.toString() : '');
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Set Limit
                                </button>
                                <button
                                  onClick={() => handleUserAction(u.id, 'resetUsage')}
                                  className="text-purple-600 hover:text-purple-900"
                                >
                                  Reset Usage
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.users.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics.users.pending}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Images</p>
                <p className="text-3xl font-bold text-indigo-600">{analytics.images.totalGenerated}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Generations</p>
                <p className="text-3xl font-bold text-green-600">{analytics.images.totalGenerations}</p>
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topUsers.map((u, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.imagesGenerated}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.imageLimit > 0 ? u.imageLimit : 'Unlimited'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {analytics.recentGenerations.map((gen, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {gen.userId?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">{gen.userId?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{gen.imagesCount} images</p>
                      <p className="text-xs text-gray-500">
                        {new Date(gen.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

