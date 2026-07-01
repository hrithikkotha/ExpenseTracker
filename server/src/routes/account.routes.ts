import { Router } from 'express';
import * as accountController from '../controllers/account.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import {
  accountIdSchema,
  createAccountSchema,
  updateAccountSchema,
} from '../validators/account.validators';

const router = Router();

router.use(authGuard);

router.get('/', accountController.list);
router.post('/', validate(createAccountSchema), accountController.create);
router.get('/:id', validate(accountIdSchema), accountController.getOne);
router.patch('/:id', validate(updateAccountSchema), accountController.update);
router.delete('/:id', validate(accountIdSchema), accountController.remove);
router.get('/:id/balance', validate(accountIdSchema), accountController.getBalance);
router.post('/sync', accountController.syncBalances);

export default router;
