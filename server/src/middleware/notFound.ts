import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/** Catches any request that didn't match a route and forwards a 404. */
export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
