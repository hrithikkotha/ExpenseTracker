import { User, type UserDocument } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { Account } from '../models/Account';
import { AppError } from '../utils/AppError';
import crypto from 'node:crypto';
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
} from '../utils/token';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validators/auth.validators';
import { sendPasswordResetOTPEmail } from './email.service';

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

export interface AuthResult {
  user: UserDocument;
  accessToken: string;
  refreshToken: string; // raw token — caller sets it as an HTTP-only cookie
}

/** Issues a fresh access token and a persisted (hashed) refresh token. */
async function issueTokens(
  user: UserDocument,
  meta: RequestMeta,
): Promise<AuthResult> {
  const rawRefresh = generateRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawRefresh),
    expiresAt: refreshTokenExpiry(),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return {
    user,
    accessToken: signAccessToken(user.id),
    refreshToken: rawRefresh,
  };
}

export async function register(
  input: RegisterInput,
  meta: RequestMeta,
): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
  });

  // Create default Cash account for new user
  await Account.create({
    user: user._id,
    name: 'Cash',
    type: 'cash',
    icon: '💵',
    color: '#22c55e',
    currency: user.currency,
    openingBalance: 0,
    currentBalance: 0,
    isDefault: true,
    includeInNetWorth: true,
  });

  return issueTokens(user, meta);
}

export async function login(
  input: LoginInput,
  meta: RequestMeta,
): Promise<AuthResult> {
  // Need the password field, which is select:false by default.
  const user = await User.findOne({ email: input.email }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    throw AppError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueTokens(user, meta);
}

/**
 * Rotates a refresh token. Detects reuse of an already-rotated/revoked token:
 * if that happens, the whole token family for the user is revoked (a strong
 * signal of theft) and the request is rejected.
 */
export async function refresh(
  rawToken: string | undefined,
  meta: RequestMeta,
): Promise<AuthResult> {
  if (!rawToken) throw AppError.unauthorized('Refresh token missing');

  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) throw AppError.unauthorized('Invalid refresh token');

  // Reuse detection: a token that was already rotated/revoked is being used.
  if (stored.revokedAt) {
    await RefreshToken.updateMany(
      { user: stored.user, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
    throw AppError.unauthorized('Refresh token reuse detected');
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized('Refresh token expired');
  }

  const user = await User.findById(stored.user);
  if (!user) throw AppError.unauthorized('User no longer exists');

  // Rotate: mint a new refresh token and revoke the old one, linking them.
  const result = await issueTokens(user, meta);
  stored.revokedAt = new Date();
  stored.replacedByHash = hashToken(result.refreshToken);
  await stored.save();

  return result;
}

/** Revokes a single refresh token (logout on this device). */
export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

export async function requestPasswordResetOTP(input: ForgotPasswordInput): Promise<void> {
  const user = await User.findOne({ email: input.email });
  // Always return success/avoid enumeration
  if (!user) return;

  // Generate 6-digit numeric OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOTP = hashToken(otp);
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.passwordResetOTP = hashedOTP;
  user.passwordResetOTPExpires = otpExpiry;
  await user.save();

  await sendPasswordResetOTPEmail(user.email, otp);
}

export async function resetPasswordWithOTP(input: ResetPasswordInput): Promise<void> {
  const hashedOTP = hashToken(input.otp);

  const user = await User.findOne({
    email: input.email,
    passwordResetOTP: hashedOTP,
    passwordResetOTPExpires: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    throw AppError.unauthorized('Invalid or expired OTP');
  }

  // Update password and clear OTP
  user.password = input.password;
  user.passwordResetOTP = undefined;
  user.passwordResetOTPExpires = undefined;
  await user.save();

  // Invalidate user sessions / refresh tokens
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}
