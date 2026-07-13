import { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, Activity, Key } from 'lucide-react';
import { api } from '../lib/axios';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  transactionCount: number;
  lastTransactionDate?: string;
}

function formatDate(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(date?: string) {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, isActive: boolean) => {
    setToggling(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { isActive });
      setUsers((prev) => prev.map((u) => (u._id === userId ? res.data.data : u)));
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setToggling(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');
    try {
      await api.patch(`/admin/users/${resettingUser._id}/reset-password`, { password: newPassword });
      setResetSuccess(`Password for ${resettingUser.name} has been reset successfully!`);
      setNewPassword('');
      setTimeout(() => {
        setResettingUser(null);
        setResetSuccess('');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setResetError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const regularUsers = users.filter((u) => u.role !== 'admin');
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const activeUsers = regularUsers.filter(
    (u) => u.lastLoginAt && new Date(u.lastLoginAt) > sevenDaysAgo,
  );
  const newUsers = regularUsers.filter(
    (u) => new Date(u.createdAt) > thirtyDaysAgo,
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<Users className="w-4 h-4 md:w-5 md:h-5" />}
          label="Total Users"
          value={regularUsers.length}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          icon={<UserCheck className="w-4 h-4 md:w-5 md:h-5" />}
          label="Active (7d)"
          value={activeUsers.length}
          color="bg-green-500/10 text-green-400"
        />
        <StatCard
          icon={<UserPlus className="w-4 h-4 md:w-5 md:h-5" />}
          label="New (30d)"
          value={newUsers.length}
          color="bg-purple-500/10 text-purple-400"
        />
        <StatCard
          icon={<Activity className="w-4 h-4 md:w-5 md:h-5" />}
          label="Inactive"
          value={regularUsers.filter((u) => !u.isActive).length}
          color="bg-red-500/10 text-red-400"
        />
      </div>

      {/* Users Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-white">All Users</h2>
          <p className="text-xs md:text-sm text-gray-400">{regularUsers.length} registered accounts</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Joined</th>
                    <th className="px-6 py-3 text-left">Last Login</th>
                    <th className="px-6 py-3 text-right">Transactions</th>
                    <th className="px-6 py-3 text-left">Last Activity</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {regularUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge isActive={user.isActive} />
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {timeAgo(user.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-mono">
                        {user.transactionCount}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {timeAgo(user.lastTransactionDate)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <ToggleButton
                            isActive={user.isActive}
                            isLoading={toggling === user._id}
                            onClick={() => toggleStatus(user._id, !user.isActive)}
                          />
                          <button
                            onClick={() => setResettingUser(user)}
                            className="px-2.5 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                            Reset Pass
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-gray-800">
              {regularUsers.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No users found
                </div>
              ) : (
                regularUsers.map((user) => (
                  <div key={user._id} className="p-4 space-y-3">
                    {/* Header: Name + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <StatusBadge isActive={user.isActive} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-800/50 rounded-lg px-2.5 py-2">
                        <p className="text-gray-500 mb-0.5">Joined</p>
                        <p className="text-gray-300 font-medium">{formatDate(user.createdAt)}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg px-2.5 py-2">
                        <p className="text-gray-500 mb-0.5">Last Login</p>
                        <p className="text-gray-300 font-medium">{timeAgo(user.lastLoginAt)}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg px-2.5 py-2">
                        <p className="text-gray-500 mb-0.5">Txns</p>
                        <p className="text-gray-300 font-medium font-mono">{user.transactionCount}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <ToggleButton
                        isActive={user.isActive}
                        isLoading={toggling === user._id}
                        onClick={() => toggleStatus(user._id, !user.isActive)}
                        fullWidth
                      />
                      <button
                        onClick={() => setResettingUser(user)}
                        className="px-3 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-medium transition-colors min-h-[36px] flex-1 flex items-center justify-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Reset Password
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Reset User Password</h3>
              <p className="text-sm text-gray-400">
                Set a new password for <span className="font-semibold text-gray-200">{resettingUser.name}</span> ({resettingUser.email}).
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="modal-password" className="block text-xs font-medium text-gray-400 mb-1">
                  New Password
                </label>
                <input
                  id="modal-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                />
              </div>

              {resetError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-2.5">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-lg p-2.5">
                  {resetSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 text-sm pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResettingUser(null);
                    setNewPassword('');
                    setResetError('');
                    setResetSuccess('');
                  }}
                  disabled={resetLoading}
                  className="px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !!resetSuccess}
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors font-medium"
                >
                  {resetLoading ? 'Resetting...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-5">
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 md:mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xl md:text-2xl font-bold text-white">{value}</p>
      <p className="text-xs md:text-sm text-gray-400">{label}</p>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        isActive
          ? 'bg-green-500/10 text-green-400'
          : 'bg-red-500/10 text-red-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
      {isActive ? 'Active' : 'Disabled'}
    </span>
  );
}

function ToggleButton({
  isActive,
  isLoading,
  onClick,
  fullWidth,
}: {
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 min-h-[36px] ${
        fullWidth ? 'w-full' : ''
      } ${
        isActive
          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
      }`}
    >
      {isLoading ? '...' : isActive ? 'Disable' : 'Enable'}
    </button>
  );
}
