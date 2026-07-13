import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as adminService from '../services/admin.service';

export const listUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await adminService.listUsers();
  res.status(200).json({ success: true, data: users });
});

export const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.toggleUserStatus(req.params.id, req.body.isActive);
  res.status(200).json({ success: true, data: user });
});

export const resetUserPassword = catchAsync(async (req: Request, res: Response) => {
  await adminService.resetUserPassword(req.params.id, req.body.password);
  res.status(200).json({ success: true, message: 'User password reset successfully' });
});
