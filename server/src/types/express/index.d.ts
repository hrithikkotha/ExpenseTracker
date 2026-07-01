import type { UserDocument } from '../../models/User';

// Augment Express Request with the authenticated user set by authGuard.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};
