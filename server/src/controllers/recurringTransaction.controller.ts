import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as recurringTransactionService from '../services/recurringTransaction.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const recurring = await recurringTransactionService.listRecurringTransactions(
    req.user!.id,
    includeInactive
  );
  res.status(200).json({ success: true, data: recurring });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const recurring = await recurringTransactionService.getRecurringTransaction(
    req.user!.id,
    req.params.id
  );
  res.status(200).json({ success: true, data: recurring });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const recurring = await recurringTransactionService.createRecurringTransaction(
    req.user!.id,
    req.body
  );
  res.status(201).json({ success: true, data: recurring });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const recurring = await recurringTransactionService.updateRecurringTransaction(
    req.user!.id,
    req.params.id,
    req.body
  );
  res.status(200).json({ success: true, data: recurring });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await recurringTransactionService.deleteRecurringTransaction(
    req.user!.id,
    req.params.id
  );
  res.status(204).send();
});

export const skipNext = catchAsync(async (req: Request, res: Response) => {
  const recurring = await recurringTransactionService.skipNextOccurrence(
    req.user!.id,
    req.params.id
  );
  res.status(200).json({ success: true, data: recurring });
});

export const setOverrideAmount = catchAsync(async (req: Request, res: Response) => {
  const recurring = await recurringTransactionService.setNextOverrideAmount(
    req.user!.id,
    req.params.id,
    req.body
  );
  res.status(200).json({ success: true, data: recurring });
});

export const processPending = catchAsync(async (req: Request, res: Response) => {
  const count = await recurringTransactionService.processPendingRecurringTransactions(
    req.user!.id
  );
  res.status(200).json({ success: true, data: { processed: count } });
});
