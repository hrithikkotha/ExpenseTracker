import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import {
  budgetIdSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '../validators/budget.validators';

const router = Router();

router.use(authGuard);

router.get('/', budgetController.list);
router.post('/', validate(createBudgetSchema), budgetController.create);
router.get('/:id', validate(budgetIdSchema), budgetController.getOne);
router.patch('/:id', validate(updateBudgetSchema), budgetController.update);
router.delete('/:id', validate(budgetIdSchema), budgetController.remove);

export default router;
