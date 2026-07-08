import { connectDB, disconnectDB } from '../config/db';

/**
 * Dev-only helper script. Production recurring transactions are processed lazily
 * per-user when they open the app via POST /recurring-transactions/process-pending.
 *
 * Usage: node -r esbuild-register src/jobs/processRecurringTransactions.ts
 */

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    console.log('ℹ️  Recurring transactions are processed lazily per-user via the API in production.');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Job failed:', error);
    process.exit(1);
  }
}

run();
