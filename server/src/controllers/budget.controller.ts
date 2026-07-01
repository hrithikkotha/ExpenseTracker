import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as budgetService from '../services/budget.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  const budgets = await budgetService.listBudgets(req.user!.id);
  res.status(200).json({ success: true, data: budgets });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const budget = await budgetService.getBudget(req.user!.id, req.params.id);
  res.status(200).json({ success: true, data: budget });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const budget = await budgetService.createBudget(req.user!.id, req.body);
  res.status(201).json({ success: true, data: budget });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const budget = await budgetService.updateBudget(
    req.user!.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ success: true, data: budget });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await budgetService.deleteBudget(req.user!.id, req.params.id);
  res.status(204).send();
});
