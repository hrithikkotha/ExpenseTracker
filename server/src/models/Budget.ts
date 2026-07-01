import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export type BudgetPeriod = 'monthly' | 'yearly';

export interface IBudget {
  user: Types.ObjectId;
  category: Types.ObjectId | null; // null = overall budget
  amount: number;
  period: BudgetPeriod;
  month?: number; // 1-12 for monthly budgets
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BudgetDocument = HydratedDocument<IBudget>;

const budgetSchema = new Schema<IBudget>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      set: (v: number) => Math.round(v * 100) / 100,
    },
    period: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    month: { type: Number, min: 1, max: 12 },
    year: { type: Number, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as { __v?: unknown }).__v;
        return ret;
      },
    },
  },
);

// One budget per user/category/period/month/year combination.
budgetSchema.index(
  { user: 1, category: 1, period: 1, month: 1, year: 1 },
  { unique: true },
);

export const Budget = model<IBudget>('Budget', budgetSchema);
