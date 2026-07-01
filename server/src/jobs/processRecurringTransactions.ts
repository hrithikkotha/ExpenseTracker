import { connectDB, disconnectDB } from '../config/db';
import { processRecurringTransactions } from '../services/recurringTransaction.service';

/**
 * Cron job to process recurring transactions.
 * Run this daily at 2 AM: 0 2 * * *
 *
 * Usage: node -r esbuild-register src/jobs/processRecurringTransactions.ts
 */

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const count = await processRecurringTransactions();
    console.log(`✅ Processed ${count} recurring transactions`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Job failed:', error);
    process.exit(1);
  }
}

run();
