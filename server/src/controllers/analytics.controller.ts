import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as analyticsService from '../services/analytics.service';
import type {
  SummaryQuery,
  TrendsQuery,
} from '../validators/analytics.validators';

export const summary = catchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.getSummary(
    req.user!.id,
    req.query as unknown as SummaryQuery,
  );
  res.status(200).json({ success: true, data });
});

export const trends = catchAsync(async (req: Request, res: Response) => {
  const data = await analyticsService.getTrends(
    req.user!.id,
    req.query as unknown as TrendsQuery,
  );
  res.status(200).json({ success: true, data });
});
