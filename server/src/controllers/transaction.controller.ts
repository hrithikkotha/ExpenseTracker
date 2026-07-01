import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as transactionService from '../services/transaction.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  const transactions = await transactionService.listTransactions(req.user!.id);
  res.status(200).json({ success: true, data: transactions });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const txn = await transactionService.getTransaction(
    req.user!.id,
    req.params.id,
  );
  res.status(200).json({ success: true, data: txn });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const txn = await transactionService.createTransaction(
    req.user!.id,
    req.body,
  );
  res.status(201).json({ success: true, data: txn });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const txn = await transactionService.updateTransaction(
    req.user!.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ success: true, data: txn });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await transactionService.deleteTransaction(req.user!.id, req.params.id);
  res.status(204).send();
});
