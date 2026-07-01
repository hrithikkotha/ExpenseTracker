import type { CategoryType } from '../models/Category';

export interface DefaultCategory {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

/** System default categories (user: null, isDefault: true). Seeded once. */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Expenses
  { name: 'Food & Drink', type: 'expense', icon: '🍔', color: '#ef4444' },
  { name: 'Groceries', type: 'expense', icon: '🛒', color: '#f97316' },
  { name: 'Rent', type: 'expense', icon: '🏠', color: '#a855f7' },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#eab308' },
  { name: 'Transport', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { name: 'Health', type: 'expense', icon: '🏥', color: '#10b981' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#ec4899' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#8b5cf6' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#14b8a6' },
  { name: 'Travel', type: 'expense', icon: '✈️', color: '#06b6d4' },
  { name: 'Other Expense', type: 'expense', icon: '🏷️', color: '#6b7280' },
  // Income
  { name: 'Salary', type: 'income', icon: '💰', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#0ea5e9' },
  { name: 'Investments', type: 'income', icon: '📈', color: '#84cc16' },
  { name: 'Gifts', type: 'income', icon: '🎁', color: '#f43f5e' },
  { name: 'Other Income', type: 'income', icon: '🏷️', color: '#6b7280' },
];
