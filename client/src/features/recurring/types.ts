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
  purpose: string;
  note?: string;
  frequency: RecurrenceFrequency;
  daysOfWeek: number[];       // 0=Sun … 6=Sat; for weekly/biweekly; [] = every occurrence
  dayOfMonth?: number;        // 1-31 for monthly
  executionTime: string;      // "HH:MM"
  startDate: string;
  endDate?: string;
  nextOccurrence: string;
  isActive: boolean;
  nextOverrideAmount?: number;
  lastCreatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  accountId: string;
  purpose: string;
  note?: string;
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  executionTime?: string;
  startDate: Date | string;
  endDate?: Date | string;
}

export interface UpdateRecurringTransactionInput {
  type?: 'income' | 'expense';
  amount?: number;
  accountId?: string;
  purpose?: string;
  note?: string;
  frequency?: RecurrenceFrequency;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  executionTime?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
}

