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

  // Serve client static files (checks if client/dist exists for monorepo deployment)
  const clientPath = path.resolve(__dirname, '../../client/dist');
  const fs = require('fs');

  if (fs.existsSync(clientPath)) {
    // PWA: Special handling for service worker (must not be cached)
    app.get('/sw.js', (_req, res) => {
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(clientPath, 'sw.js'));
    });

    // PWA: Workbox runtime with no-cache
    app.get('/workbox-*.js', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      const filename = _req.path.split('/').pop() || '';
      res.sendFile(path.join(clientPath, filename));
    });

    // PWA: Manifest with proper content type
    app.get('/manifest.webmanifest', (_req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json');
      res.sendFile(path.join(clientPath, 'manifest.webmanifest'));
    });

    // PWA: registerSW.js with no-cache
    app.get('/registerSW.js', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(clientPath, 'registerSW.js'));
    });

    // Production monorepo: serve client build with caching for other assets
    app.use(express.static(clientPath, {
      maxAge: '1d', // Cache static assets for 1 day
      etag: true,
    }));

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
