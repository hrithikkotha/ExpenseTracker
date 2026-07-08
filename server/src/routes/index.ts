import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import analyticsRoutes from './analytics.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import accountRoutes from './account.routes';
import recurringTransactionRoutes from './recurringTransaction.routes';
import tagRoutes from './tag.routes';
import transferRoutes from './transfer.routes';
import exportRoutes from './export.routes';

/**
 * API v1 router.
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/accounts', accountRoutes);
router.use('/recurring-transactions', recurringTransactionRoutes);
router.use('/tags', tagRoutes);
router.use('/transfers', transferRoutes);
router.use('/export', exportRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
