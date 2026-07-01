import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export type CategoryType = 'income' | 'expense';

export interface ICategory {
  // null = system default (visible to everyone); set = owned by that user.
  user: Types.ObjectId | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<ICategory>;

const categorySchema = new Schema<ICategory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: 1,
      maxlength: 40,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    icon: { type: String, default: '🏷️', trim: true, maxlength: 8 },
    color: {
      type: String,
      default: '#6366f1',
      match: [/^#([0-9a-fA-F]{6})$/, 'Color must be a hex value like #4f46e5'],
    },
    isDefault: { type: Boolean, default: false },
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

// A user can't have two categories with the same name+type. System defaults
// (user: null) are likewise unique among themselves.
categorySchema.index({ user: 1, type: 1, name: 1 }, { unique: true });

export const Category = model<ICategory>('Category', categorySchema);
