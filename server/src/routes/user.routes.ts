import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import {
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/user.validators';

const router = Router();

router.use(authGuard);

router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.post('/me/password', validate(changePasswordSchema), userController.changePassword);

export default router;
