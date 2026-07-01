import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import transactionRoutes from './transaction.routes';
import analyticsRoutes from './analytics.routes';
import budgetRoutes from './budget.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

/**
 * API v1 router.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/budgets', budgetRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
