/**
 * Script to inspect a specific recurring transaction document
 * Run with: npx tsx src/scripts/inspectRecurringTransaction.ts
 */
import { connectDB, disconnectDB } from '../config/db';
import mongoose from 'mongoose';

const TRANSACTION_ID = '6a4e2cd9e6d20cdb8f4ae151'; // The problematic ID from the logs

async function inspect() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');

    // Get the recurring transactions collection
    const collection = db.collection('recurringtransactions');

    // Find the specific document
    const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(TRANSACTION_ID) });

    if (!doc) {
      console.log('❌ Document not found');
    } else {
      console.log('✅ Found document:');
      console.log(JSON.stringify(doc, null, 2));
      console.log('\n📋 Document keys:', Object.keys(doc));
      console.log('❓ Has category field:', 'category' in doc);

      if ('category' in doc) {
        console.log('⚠️  FOUND CATEGORY FIELD:', doc.category);
      }
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

inspect();
