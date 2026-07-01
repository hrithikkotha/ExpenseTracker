import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/token';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { catchAsync } from '../utils/catchAsync';

/**
 * Verifies the Bearer access token and attaches the user to req.user.
 * Rejects with 401 if the token is missing, malformed, expired, or the
 * user no longer exists. (Account-status enforcement is added in Phase 8.)
 */
export const authGuard = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication required');
    }

    const token = header.slice('Bearer '.length).trim();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw AppError.unauthorized('User no longer exists');
    }

    req.user = user;
    next();
  },
);
