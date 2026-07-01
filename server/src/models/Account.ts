import { Schema, model, Types, type HydratedDocument } from 'mongoose';

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

export interface IAccount {
  user: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

export type AccountDocument = HydratedDocument<IAccount>;

const accountSchema = new Schema<IAccount>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: [
        'cash',
        'bank',
        'credit_card',
        'debit_card',
        'digital_wallet',
        'savings',
        'investment',
        'loan',
        'custom',
      ],
      required: true,
    },
    icon: {
      type: String,
      default: '💳',
    },
    color: {
      type: String,
      default: '#6366f1',
      match: /^#[0-9A-F]{6}$/i,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      length: 3,
    },
    openingBalance: {
      type: Number,
      default: 0,
      set: (v: number) => Math.round(v * 100) / 100,
    },
    currentBalance: {
      type: Number,
      default: 0,
      set: (v: number) => Math.round(v * 100) / 100,
    },
    includeInNetWorth: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
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

// Compound indexes for common queries
accountSchema.index({ user: 1, isArchived: 1 });
accountSchema.index({ user: 1, isDefault: 1 });

// Ensure only one default account per user
accountSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await model('Account').updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } },
    );
  }
  next();
});

export const Account = model<IAccount>('Account', accountSchema);
