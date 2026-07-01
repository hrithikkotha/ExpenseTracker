import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env';
import apiRouter from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

/**
 * Builds the Express application WITHOUT starting a listener, so it can be
 * imported directly by integration tests.
 */
export function createApp(): Application {
  const app = express();

  // Behind a proxy (Render) so req.ip / secure cookies work correctly.
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window per IP
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Sanitize against NoSQL injection
  app.use(mongoSanitize());

  // API v1
  app.use('/api/v1', apiRouter);

  // 404 + centralized error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
