export type AccountType =
  | 'cash'
  | 'bank'
  | 'credit_card'
  | 'debit_card'
  | 'digital_wallet'
  | 'savings'
  | 'investment'
  | 'loan'
  | 'custom';

export interface Account {
  _id: string;
  user: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  includeInNetWorth: boolean;
  isDefault: boolean;
  isArchived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  currency: string;
  openingBalance: number;
  includeInNetWorth?: boolean;
  isDefault?: boolean;
  notes?: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  icon?: string;
  color?: string;
  currency?: string;
  openingBalance?: number;
  includeInNetWorth?: boolean;
  isDefault?: boolean;
  isArchived?: boolean;
  notes?: string;
}

export interface AccountBalance {
  balance: number;
}
