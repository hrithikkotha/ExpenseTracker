import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function adminGuard(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }
  if (req.user.role !== 'admin') {
    throw AppError.forbidden('Admin access required');
  }
  next();
}
