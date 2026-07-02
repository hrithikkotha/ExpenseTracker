export type CategoryType = 'income' | 'expense';

export interface PopulatedCategory {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  _id: string;
  user: string;
  type: CategoryType;
  amount: number;
  purpose: string; // Main identifier for transaction
  note?: string; // Optional description
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  type: CategoryType;
  amount: number;
  accountId: string; // Required - which account the transaction is from/to
  purpose: string; // REQUIRED - main identifier (e.g., "Groceries", "Salary")
  note?: string; // Optional - additional description
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
  accountId?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  q?: string; // Search query (searches purpose and note)
  sort?: TransactionSort;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  items: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
