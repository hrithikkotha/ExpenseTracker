import { Router } from 'express';
import * as recurringTransactionController from '../controllers/recurringTransaction.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdSchema,
  setOverrideAmountSchema,
} from '../validators/recurringTransaction.validators';

const router = Router();

router.use(authGuard);

router.get('/', recurringTransactionController.list);
router.post('/', validate(createRecurringTransactionSchema), recurringTransactionController.create);
router.post('/process-pending', recurringTransactionController.processPending);
router.get('/:id', validate(recurringTransactionIdSchema), recurringTransactionController.getOne);
router.patch('/:id', validate(updateRecurringTransactionSchema), recurringTransactionController.update);
router.delete('/:id', validate(recurringTransactionIdSchema), recurringTransactionController.remove);
router.post('/:id/skip', validate(recurringTransactionIdSchema), recurringTransactionController.skipNext);
router.patch('/:id/override-amount', validate(setOverrideAmountSchema), recurringTransactionController.setOverrideAmount);

export default router;
