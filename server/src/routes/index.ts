import { Router } from 'express';
import healthRoutes from './health.routes';

/**
 * API v1 router. Feature routers (auth, transactions, categories, budgets,
 * analytics, users, admin) will be mounted here in later phases.
 */
const router = Router();

router.use('/health', healthRoutes);

export default router;
