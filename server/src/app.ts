import express, { type Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRouter from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

/**
 * Builds the Express application WITHOUT starting a listener, so it can be
 * imported directly by integration tests. Security middleware (Helmet,
 * rate limiting, cookie parsing, mongo-sanitize) is added in later phases.
 */
export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // API v1
  app.use('/api/v1', apiRouter);

  // 404 + centralized error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
