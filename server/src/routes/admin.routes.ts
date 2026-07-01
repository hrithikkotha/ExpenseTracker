import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authGuard } from '../middleware/authGuard';
import { adminGuard } from '../middleware/adminGuard';
import { validate } from '../middleware/validate';
import { toggleStatusSchema } from '../validators/admin.validators';

const router = Router();

router.use(authGuard);
router.use(adminGuard);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', validate(toggleStatusSchema), adminController.toggleUserStatus);

export default router;
