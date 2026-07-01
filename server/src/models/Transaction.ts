import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface ITransaction {
  user: Types.ObjectId;
  account: Types.ObjectId; // account where money came from/went to
  type: TransactionType;
  amount: number; // positive; stored with 2-decimal precision
  category?: Types.ObjectId; // optional for transfers
  toAccount?: Types.ObjectId; // destination account for transfers
  transferPairId?: Types.ObjectId; // links paired transfer transactions
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionDocument = HydratedDocument<ITransaction>;

const transactionSchema = new Schema<ITransaction>(
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
      enum: ['income', 'expense', 'transfer'],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      // Guard against floating-point noise from the client.
      set: (v: number) => Math.round(v * 100) / 100,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: function (this: ITransaction) {
        return this.type !== 'transfer';
      },
    },
    toAccount: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
    },
    transferPairId: {
      type: Schema.Types.ObjectId,
    },
    note: { type: String, trim: true, maxlength: 280 },
    date: { type: Date, required: true },
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

// Default list + date-range reports.
transactionSchema.index({ user: 1, date: -1 });
// Type-filtered lists/reports.
transactionSchema.index({ user: 1, type: 1, date: -1 });
// Category reports + "is this category in use?" checks.
transactionSchema.index({ user: 1, category: 1 });
// Account-specific transaction lists.
transactionSchema.index({ user: 1, account: 1, date: -1 });
// Transfer destination account lookups.
transactionSchema.index({ user: 1, toAccount: 1, date: -1 });

export const Transaction = model<ITransaction>(
  'Transaction',
  transactionSchema,
);
