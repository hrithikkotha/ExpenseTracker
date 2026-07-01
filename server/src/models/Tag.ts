import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export interface ITag {
  user: Types.ObjectId;
  name: string;
  color: string;
  usageCount: number; // denormalized for sorting
  createdAt: Date;
  updatedAt: Date;
}

export type TagDocument = HydratedDocument<ITag>;

const tagSchema = new Schema<ITag>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    color: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
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

// Unique tag name per user
tagSchema.index({ user: 1, name: 1 }, { unique: true });
// List tags by usage
tagSchema.index({ user: 1, usageCount: -1 });

export const Tag = model<ITag>('Tag', tagSchema);
