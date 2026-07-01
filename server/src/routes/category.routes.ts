import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import {
  categoryIdSchema,
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from '../validators/category.validators';

const router = Router();

// All category routes require authentication.
router.use(authGuard);

router.get('/', validate(listCategoriesSchema), categoryController.list);
router.post('/', validate(createCategorySchema), categoryController.create);
router.patch('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', validate(categoryIdSchema), categoryController.remove);

export default router;
