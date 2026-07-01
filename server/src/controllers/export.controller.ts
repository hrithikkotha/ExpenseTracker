import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as exportService from '../services/export.service';

export const exportCSV = catchAsync(async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const fromDate = from ? new Date(from as string) : undefined;
  const toDate = to ? new Date(to as string) : undefined;

  const csv = await exportService.exportToCSV(req.user!.id, fromDate, toDate);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
  res.status(200).send(csv);
});
