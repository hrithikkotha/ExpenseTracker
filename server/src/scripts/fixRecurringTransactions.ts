/**
 * One-time script to remove stale 'category' field from recurring transactions
 * Run with: npx tsx src/scripts/fixRecurringTransactions.ts
 */
import { connectDB, disconnectDB } from '../config/db';
import mongoose from 'mongoose';

async function fixRecurringTransactions() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');

    // Get the recurring transactions collection
    const collection = db.collection('recurringtransactions');

    // Remove the category field from all documents
    const result = await collection.updateMany(
      { category: { $exists: true } },
      { $unset: { category: '' } }
    );

    console.log(`✅ Fixed ${result.modifiedCount} recurring transactions`);
    console.log(`   Matched ${result.matchedCount} documents with category field`);

    // Verify the fix
    const remaining = await collection.countDocuments({ category: { $exists: true } });
    console.log(`   Remaining documents with category field: ${remaining}`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

fixRecurringTransactions();
