import express, { type Application } from 'express';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { env, isProd } from './config/env';
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

  // Security headers (allow inline scripts for Vite in production if serving client)
  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
            },
          }
        : false,
    }),
  );

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

  // Serve client static files in production (Render monorepo deployment)
  if (isProd) {
    const clientPath = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientPath));
    // SPA fallback: serve index.html for all non-API routes
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientPath, 'index.html'));
    });
  } else {
    // Dev: client runs separately on Vite dev server
    app.use(notFound);
  }

  // Centralized error handling (must be last)
  app.use(errorHandler);

  return app;
}
