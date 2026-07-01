import { User } from '../models/User';
import { AppError } from '../utils/AppError';

interface UserListItem {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export async function listUsers(): Promise<UserListItem[]> {
  const users = await User.find()
    .select('name email role isActive createdAt lastLoginAt')
    .sort({ createdAt: -1 });

  return users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }));
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

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
