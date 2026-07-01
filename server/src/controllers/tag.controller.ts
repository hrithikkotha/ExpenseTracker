import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as tagService from '../services/tag.service';

export const list = catchAsync(async (req: Request, res: Response) => {
  const tags = await tagService.listTags(req.user!.id);
  res.status(200).json({ success: true, data: tags });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const tag = await tagService.getTag(req.user!.id, req.params.id);
  res.status(200).json({ success: true, data: tag });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const tag = await tagService.createTag(req.user!.id, req.body);
  res.status(201).json({ success: true, data: tag });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const tag = await tagService.updateTag(req.user!.id, req.params.id, req.body);
  res.status(200).json({ success: true, data: tag });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await tagService.deleteTag(req.user!.id, req.params.id);
  res.status(204).send();
});

export const frequent = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const tags = await tagService.getFrequentTags(req.user!.id, limit);
  res.status(200).json({ success: true, data: tags });
});
