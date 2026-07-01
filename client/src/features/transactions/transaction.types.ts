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

export type TransactionSort =
  | 'date'
  | '-date'
  | 'amount'
  | '-amount'
  | 'createdAt'
  | '-createdAt';

export interface TransactionFilters {
  type?: CategoryType;
  categoryId?: string;
  from?: string; // ISO (yyyy-mm-dd)
  to?: string;
  q?: string;
  sort?: TransactionSort;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTransactions {
  items: Transaction[];
  meta: PaginationMeta;
}
