import { User, type UserDocument } from '../models/User';
import { AppError } from '../utils/AppError';
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from '../validators/user.validators';

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<UserDocument> {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  // Only update fields that are provided
  if (input.name !== undefined) user.name = input.name;
  if (input.currency !== undefined) user.currency = input.currency;
  if (input.theme !== undefined) user.theme = input.theme;
  await user.save();

  return user;
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await User.findById(userId).select('+password');
  if (!user) throw AppError.notFound('User not found');

  const isMatch = await user.comparePassword(input.currentPassword);
  if (!isMatch) {
    throw AppError.unauthorized('Current password is incorrect');
  }

  user.password = input.newPassword;
  await user.save();
}
