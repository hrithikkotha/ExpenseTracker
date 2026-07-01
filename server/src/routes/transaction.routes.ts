import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import {
  createTransactionSchema,
  listTransactionsSchema,
  transactionIdSchema,
  updateTransactionSchema,
} from '../validators/transaction.validators';

const router = Router();

router.use(authGuard);

router.get('/', validate(listTransactionsSchema), transactionController.list);
router.post(
  '/',
  validate(createTransactionSchema),
  transactionController.create,
);
router.get('/:id', validate(transactionIdSchema), transactionController.getOne);
router.patch(
  '/:id',
  validate(updateTransactionSchema),
  transactionController.update,
);
router.delete(
  '/:id',
  validate(transactionIdSchema),
  transactionController.remove,
);

export default router;
