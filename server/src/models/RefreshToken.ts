import { Schema, model, Types, type HydratedDocument } from 'mongoose';

export interface IRefreshToken {
  user: Types.ObjectId;
  tokenHash: string; // SHA-256 of the raw token — the raw value is never stored
  expiresAt: Date;
  revokedAt?: Date;
  replacedByHash?: string; // set on rotation to trace the token family
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenDocument = HydratedDocument<IRefreshToken>;

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedByHash: { type: String },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true },
);

// TTL index: MongoDB auto-deletes documents once expiresAt passes.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);
