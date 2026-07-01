import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { isProd } from '../config/env';

interface ErrorBody {
  success: false;
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}

/**
 * Central error handler. Maps known error types to clean JSON envelopes and
 * never leaks stack traces or internal messages in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.flatten().fieldErrors;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message]),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    statusCode = 409;
    message = 'Duplicate value violates a unique constraint';
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('💥 Unhandled error:', err);
  }

  const body: ErrorBody = {
    success: false,
    error: {
      code: statusCode,
      // Hide internal 500 messages in production.
      message: statusCode >= 500 && isProd ? 'Internal server error' : message,
      ...(details ? { details } : {}),
    },
  };

  res.status(statusCode).json(body);
}
