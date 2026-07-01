import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as accountService from '../services/account.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeArchived = req.query.includeArchived === 'true';
  const accounts = await accountService.listAccounts(req.user!.id, includeArchived);
  res.status(200).json({ success: true, data: accounts });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const account = await accountService.getAccount(req.user!.id, req.params.id);
  res.status(200).json({ success: true, data: account });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const account = await accountService.createAccount(req.user!.id, req.body);
  res.status(201).json({ success: true, data: account });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const account = await accountService.updateAccount(
    req.user!.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ success: true, data: account });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await accountService.deleteAccount(req.user!.id, req.params.id);
  res.status(204).send();
});

export const getBalance = catchAsync(async (req: Request, res: Response) => {
  const balance = await accountService.getAccountBalance(req.user!.id, req.params.id);
  res.status(200).json({ success: true, data: { balance } });
});

export const syncBalances = catchAsync(async (req: Request, res: Response) => {
  await accountService.syncAccountBalances(req.user!.id);
  res.status(200).json({ success: true, message: 'Account balances synced' });
});
