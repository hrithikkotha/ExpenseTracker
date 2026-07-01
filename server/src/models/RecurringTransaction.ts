import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface IRecurringTransaction {
  user: Types.ObjectId;
  account: Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  category: Types.ObjectId;
  note?: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date; // null = no end date
  nextOccurrence: Date; // indexed for cron job lookups
  isActive: boolean;
  lastCreatedAt?: Date; // timestamp of last auto-created transaction
  createdAt: Date;
  updatedAt: Date;
}

export type RecurringTransactionDocument = HydratedDocument<IRecurringTransaction>;

const recurringTransactionSchema = new Schema<IRecurringTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      set: (v: number) => Math.round(v * 100) / 100,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    note: { type: String, trim: true, maxlength: 280 },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    nextOccurrence: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    lastCreatedAt: { type: Date },
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

// Index for cron job queries (find upcoming transactions to process)
recurringTransactionSchema.index({ nextOccurrence: 1, isActive: 1 });
// User's recurring transactions
recurringTransactionSchema.index({ user: 1, isActive: 1 });

export const RecurringTransaction = model<IRecurringTransaction>(
  'RecurringTransaction',
  recurringTransactionSchema,
);
