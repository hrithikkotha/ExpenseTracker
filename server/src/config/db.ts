import mongoose from 'mongoose';
import { env } from './env';

/**
 * Connection state, exposed so the health check can report DB readiness
 * without the whole process crashing if Mongo is temporarily unreachable.
 */
export function dbState(): string {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected');
  });
  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('⚠️  MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('⚠️  MongoDB disconnected');
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Non-fatal in dev: the API still boots so /health works and you can
    // fix your connection string without restarting your editor tooling.
    // eslint-disable-next-line no-console
    console.error(
      `⚠️  Could not connect to MongoDB (${message}). ` +
        'The server is running; the health check will report DB status.',
    );
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
}
