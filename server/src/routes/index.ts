import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';

/**
 * API v1 router. Feature routers (transactions, categories, budgets,
 * analytics, users, admin) will be mounted here in later phases.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);

export default router;
