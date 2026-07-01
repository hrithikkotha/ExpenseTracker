import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as transferService from '../services/transfer.service';

export const create = catchAsync(async (req: Request, res: Response) => {
  const transfer = await transferService.createTransfer(req.user!.id, req.body);
  res.status(201).json({ success: true, data: transfer });
});

export const deletePair = catchAsync(async (req: Request, res: Response) => {
  await transferService.deleteTransferPair(req.user!.id, req.params.transferPairId);
  res.status(204).send();
});
