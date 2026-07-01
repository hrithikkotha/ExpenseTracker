import { Router } from 'express';
import { dbState } from '../config/db';

const router = Router();

/**
 * GET /api/v1/health
 * Liveness + DB readiness probe. Used by Render health checks and local
 * verification. Returns 200 as long as the API process is up; the `db`
 * field reports the current Mongo connection state.
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      db: dbState(),
    },
  });
});

export default router;
