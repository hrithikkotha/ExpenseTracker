import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as userService from '../services/user.service';

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.status(200).json({ success: true, data: user });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  await userService.changePassword(req.user!.id, req.body);
  res.status(204).send();
});
