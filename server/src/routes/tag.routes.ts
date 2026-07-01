import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.use(authGuard);

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createTagSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
});

const updateTagSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }).refine(v => Object.keys(v).length > 0, { message: 'At least one field required' }),
});

const tagIdSchema = z.object({
  params: z.object({ id: objectId }),
});

router.get('/', tagController.list);
router.get('/frequent', tagController.frequent);
router.post('/', validate(createTagSchema), tagController.create);
router.get('/:id', validate(tagIdSchema), tagController.getOne);
router.patch('/:id', validate(updateTagSchema), tagController.update);
router.delete('/:id', validate(tagIdSchema), tagController.remove);

export default router;
