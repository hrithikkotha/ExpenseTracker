import type { CategoryType } from '../categories/category.types';

/** Category as embedded in a populated transaction. */
export interface PopulatedCategory {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export interface Transaction {
  _id: string;
  user: string;
  type: CategoryType;
  amount: number;
  category: PopulatedCategory;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  type: CategoryType;
  amount: number;
  categoryId: string;
  note?: string;
  date: string; // ISO
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;
