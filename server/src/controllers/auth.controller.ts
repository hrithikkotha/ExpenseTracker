import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookies';
import { env } from '../config/env';
import * as authService from '../services/auth.service';

function requestMeta(req: Request) {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body,
    requestMeta(req),
  );
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.body,
    requestMeta(req),
  );
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const raw = req.cookies?.[env.REFRESH_COOKIE_NAME];
  const { user, accessToken, refreshToken } = await authService.refresh(
    raw,
    requestMeta(req),
  );
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user, accessToken } });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const raw = req.cookies?.[env.REFRESH_COOKIE_NAME];
  await authService.logout(raw);
  clearRefreshCookie(res);
  res.status(204).send();
});

export const me = catchAsync(async (req: Request, res: Response) => {
  // authGuard guarantees req.user is set.
  res.status(200).json({ success: true, data: { user: req.user } });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.requestPasswordResetOTP(req.body);
  res.status(200).json({
    success: true,
    message: 'If the email exists, a password reset OTP has been sent.',
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPasswordWithOTP(req.body);
  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully.',
  });
});
