export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  _id: string;
  user: string;
  account: {
    _id: string;
    name: string;
    icon: string;
    color: string;
  };
  type: 'income' | 'expense';
  amount: number;
  category: {
    _id: string;
    name: string;
    icon: string;
    color: string;
    type: 'income' | 'expense';
  };
  note?: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string;
  nextOccurrence: string;
  isActive: boolean;
  lastCreatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  accountId: string;
  categoryId: string;
  note?: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date;
}

export interface UpdateRecurringTransactionInput {
  type?: 'income' | 'expense';
  amount?: number;
  accountId?: string;
  categoryId?: string;
  note?: string;
  frequency?: RecurrenceFrequency;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}
