import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface IRecurringTransaction {
  user: Types.ObjectId;
  account: Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  purpose: string;       // what the transaction is for, e.g. "Rent", "Salary"
  note?: string;
  frequency: RecurrenceFrequency;
  daysOfWeek: number[];  // 0=Sun…6=Sat; for weekly/biweekly only; empty [] = fire every occurrence (no day filter)
  dayOfMonth?: number;   // 1-31 for monthly (1-30/31 depending on month); null/undefined = use startDate's day
  executionTime: string; // "HH:MM" 24-hour; logical "fire time" used for backdating
  startDate: Date;
  endDate?: Date;
  nextOccurrence: Date;  // next date this should be processed; updated after each occurrence
  isActive: boolean;
  nextOverrideAmount?: number; // one-time amount for next pending occurrence; cleared after use
  lastCreatedAt?: Date;
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
    purpose: {
      type: String,
      required: [true, 'Purpose is required'],
      trim: true,
      maxlength: [100, 'Purpose must be 100 characters or less'],
    },
    note: { type: String, trim: true, maxlength: 280 },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'],
      required: true,
    },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr: number[]) => arr.every((d) => d >= 0 && d <= 6),
        message: 'daysOfWeek values must be 0 (Sun) through 6 (Sat)',
      },
    },
    dayOfMonth: {
      type: Number,
      validate: {
        validator: (v: number) => v >= 1 && v <= 31,
        message: 'dayOfMonth must be 1 through 31',
      },
    },
    executionTime: {
      type: String,
      default: '09:00',
      validate: {
        validator: (v: string) => /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: 'executionTime must be in HH:MM format (24-hour)',
      },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    nextOccurrence: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    nextOverrideAmount: { type: Number, min: 0.01 },
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

// Index for lazy-processing queries
recurringTransactionSchema.index({ nextOccurrence: 1, isActive: 1 });
recurringTransactionSchema.index({ user: 1, isActive: 1 });

export const RecurringTransaction = model<IRecurringTransaction>(
  'RecurringTransaction',
  recurringTransactionSchema,
);
