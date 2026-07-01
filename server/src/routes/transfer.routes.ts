import { Router } from 'express';
import * as transferController from '../controllers/transfer.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.use(authGuard);

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

const createTransferSchema = z.object({
  body: z.object({
    fromAccountId: objectId,
    toAccountId: objectId,
    amount: z.number().positive(),
    note: z.string().trim().max(280).optional(),
    date: z.coerce.date(),
  }),
});

const transferPairIdSchema = z.object({
  params: z.object({ transferPairId: objectId }),
});

router.post('/', validate(createTransferSchema), transferController.create);
router.delete('/:transferPairId', validate(transferPairIdSchema), transferController.deletePair);

export default router;
