import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as categoryService from '../services/category.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  const type = req.query.type as 'income' | 'expense' | undefined;
  const categories = await categoryService.listCategories(req.user!.id, {
    type,
  });
  res.status(200).json({ success: true, data: categories });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.user!.id, req.body);
  res.status(201).json({ success: true, data: category });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(
    req.user!.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ success: true, data: category });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.user!.id, req.params.id);
  res.status(204).send();
});
