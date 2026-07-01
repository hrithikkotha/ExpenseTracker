export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  total: number;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  expenseByCategory: CategoryBreakdown[];
}

export interface TrendPoint {
  period: string;
  income: number;
  expense: number;
}

export type Trends = TrendPoint[];

export interface SummaryFilters {
  from?: string; // ISO date
  to?: string;
}

export interface TrendsFilters {
  period?: 'monthly' | 'yearly';
  year?: number;
}
