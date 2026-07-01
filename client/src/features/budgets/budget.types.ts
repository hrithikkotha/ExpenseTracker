import type { PopulatedCategory } from '../transactions/transaction.types';

export type BudgetPeriod = 'monthly' | 'yearly';

export interface Budget {
  _id: string;
  user: string;
  category: PopulatedCategory | null;
  amount: number;
  period: BudgetPeriod;
  month?: number;
  year: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetPayload {
  categoryId?: string | null;
  amount: number;
  period: BudgetPeriod;
  month?: number;
  year: number;
}

export interface UpdateBudgetPayload {
  amount: number;
}
