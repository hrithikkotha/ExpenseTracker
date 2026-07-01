import { Router } from 'express';
import * as exportController from '../controllers/export.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.get('/csv', exportController.exportCSV);

export default router;
