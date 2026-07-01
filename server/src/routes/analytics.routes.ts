import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import {
  summarySchema,
  trendsSchema,
} from '../validators/analytics.validators';

const router = Router();

router.use(authGuard);

router.get('/summary', validate(summarySchema), analyticsController.summary);
router.get('/trends', validate(trendsSchema), analyticsController.trends);
router.get('/calendar', analyticsController.getCalendar);

export default router;
