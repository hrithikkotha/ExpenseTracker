import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../utils/AppError';

interface UserListItem {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  transactionCount: number;
  lastTransactionDate?: Date;
}

export async function listUsers(): Promise<UserListItem[]> {
  const users = await User.find()
    .select('name email role isActive createdAt lastLoginAt')
    .sort({ createdAt: -1 });

  const userIds = users.map((u) => u._id);

  // Aggregate transaction stats per user (count + last date)
  const stats = await Transaction.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 },
        lastDate: { $max: '$date' },
      },
    },
  ]);

  const statsMap = new Map(
    stats.map((s) => [s._id.toString(), { count: s.count, lastDate: s.lastDate }]),
  );

  return users.map((u) => {
    const s = statsMap.get(u._id.toString());
    return {
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      transactionCount: s?.count ?? 0,
      lastTransactionDate: s?.lastDate,
    };
  });
}

export async function toggleUserStatus(
  userId: string,
  isActive: boolean,
): Promise<UserListItem> {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  if (user.role === 'admin') {
    throw AppError.forbidden('Cannot disable admin accounts');
  }

  user.isActive = isActive;
  await user.save();

  const stats = await Transaction.aggregate([
    { $match: { user: user._id } },
    { $group: { _id: null, count: { $sum: 1 }, lastDate: { $max: '$date' } } },
  ]);
  const s = stats[0];

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    transactionCount: s?.count ?? 0,
    lastTransactionDate: s?.lastDate,
  };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  if (user.role === 'admin') {
    throw AppError.forbidden('Cannot reset admin passwords');
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all active RefreshTokens for this user (force logout)
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}
