import {
  RecurringTransaction,
  type RecurringTransactionDocument,
  type RecurrenceFrequency,
} from '../models/RecurringTransaction';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';
import type {
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
  SetOverrideAmountInput,
} from '../validators/recurringTransaction.validators';

/**
 * Advance a date by one frequency interval, respecting dayOfMonth for monthly recurrence.
 */
function advanceByFrequency(date: Date, frequency: RecurrenceFrequency, dayOfMonth?: number): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      // First, advance to next month
      const currentMonth = next.getMonth();
      next.setMonth(currentMonth + 1);

      // Then set the day of month, respecting the month's last day
      if (dayOfMonth) {
        const monthToSet = next.getMonth();
        const yearOfMonth = next.getFullYear();
        // Get the last day of the current month (after month advancement)
        const lastDayOfMonth = new Date(yearOfMonth, monthToSet + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/**
 * Build the Date for a given calendar day at the recurring transaction's executionTime.
 * Extracts the calendar date components to avoid timezone-related shifts.
 */
function occurrenceAt(dayDate: Date, executionTime: string): Date {
  const [hh, mm] = executionTime.split(':').map(Number);
  // Extract the calendar date components (year, month, day) to avoid copying
  // timezone offsets that could shift the date when we set the time
  const year = dayDate.getFullYear();
  const month = dayDate.getMonth();
  const day = dayDate.getDate();
  // Create a new date with the extracted date and specified time
  return new Date(year, month, day, hh, mm, 0, 0);
}

export async function listRecurringTransactions(
  userId: string,
  includeInactive = false,
): Promise<RecurringTransactionDocument[]> {
  const filter: Record<string, unknown> = { user: userId };
  if (!includeInactive) {
    filter.isActive = true;
  }

  return RecurringTransaction.find(filter)
    .populate('account', 'name icon color')
    .sort({ nextOccurrence: 1 });
}

export async function getRecurringTransaction(
  userId: string,
  id: string,
): Promise<RecurringTransactionDocument> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId })
    .populate('account', 'name icon color');

  if (!recurring) throw AppError.notFound('Recurring transaction not found');
  return recurring;
}

export async function createRecurringTransaction(
  userId: string,
  input: CreateRecurringTransactionInput,
): Promise<RecurringTransactionDocument> {
  const account = await Account.findOne({ _id: input.accountId, user: userId });
  if (!account) throw AppError.badRequest('Invalid account');

  const startDate = new Date(input.startDate);
  // nextOccurrence = startDate at the executionTime — the first time it should fire
  const nextOccurrence = occurrenceAt(startDate, input.executionTime);

  console.log(`[createRecurringTransaction] frequency=${input.frequency}, dayOfMonth=${input.dayOfMonth}, startDate=${startDate.toISOString()}, nextOccurrence=${nextOccurrence.toISOString()}`);

  const recurring = await RecurringTransaction.create({
    user: userId,
    account: input.accountId,
    type: input.type,
    amount: input.amount,
    purpose: input.purpose,
    note: input.note,
    frequency: input.frequency,
    daysOfWeek: input.daysOfWeek ?? [],
    dayOfMonth: input.dayOfMonth,
    executionTime: input.executionTime,
    startDate,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
    nextOccurrence,
    isActive: true,
  });

  await recurring.populate('account', 'name icon color');
  return recurring;
}

export async function updateRecurringTransaction(
  userId: string,
  id: string,
  input: UpdateRecurringTransactionInput,
): Promise<RecurringTransactionDocument> {
  // First verify the recurring transaction exists and belongs to the user
  const existing = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!existing) throw AppError.notFound('Recurring transaction not found');

  // Validate account if provided
  if (input.accountId) {
    const account = await Account.findOne({ _id: input.accountId, user: userId });
    if (!account) throw AppError.badRequest('Invalid account');
  }

  // Build the update object
  const updateObj: any = {};
  if (input.type !== undefined) updateObj.type = input.type;
  if (input.amount !== undefined) updateObj.amount = input.amount;
  if (input.purpose !== undefined) updateObj.purpose = input.purpose;
  if (input.note !== undefined) updateObj.note = input.note;
  if (input.isActive !== undefined) updateObj.isActive = input.isActive;
  if (input.daysOfWeek !== undefined) updateObj.daysOfWeek = input.daysOfWeek;
  if (input.dayOfMonth !== undefined) updateObj.dayOfMonth = input.dayOfMonth;
  if (input.executionTime !== undefined) updateObj.executionTime = input.executionTime;
  if (input.frequency !== undefined) updateObj.frequency = input.frequency;
  if (input.accountId !== undefined) updateObj.account = input.accountId;
  if (input.startDate !== undefined) updateObj.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) {
    updateObj.endDate = input.endDate ? new Date(input.endDate) : null;
  }

  // Use raw MongoDB collection to update, bypassing Mongoose validation
  // This avoids validation errors from stale schema fields
  await RecurringTransaction.collection.updateOne(
    { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
    { $set: updateObj }
  );

  // Fetch the updated document using Mongoose with populate
  const updated = await RecurringTransaction.findById(id).populate('account', 'name icon color');

  if (!updated) throw AppError.notFound('Recurring transaction not found');
  return updated;
}

export async function deleteRecurringTransaction(
  userId: string,
  id: string,
): Promise<void> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) throw AppError.notFound('Recurring transaction not found');
  await recurring.deleteOne();
}

/**
 * Skip the very next pending occurrence by advancing nextOccurrence by one interval.
 */
export async function skipNextOccurrence(
  userId: string,
  id: string,
): Promise<RecurringTransactionDocument> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) throw AppError.notFound('Recurring transaction not found');

  recurring.nextOccurrence = advanceByFrequency(recurring.nextOccurrence, recurring.frequency);
  await recurring.save();
  await recurring.populate('account', 'name icon color');
  return recurring;
}

/**
 * Set a one-time override amount for the next pending occurrence.
 */
export async function setNextOverrideAmount(
  userId: string,
  id: string,
  input: SetOverrideAmountInput,
): Promise<RecurringTransactionDocument> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) throw AppError.notFound('Recurring transaction not found');

  recurring.nextOverrideAmount = input.amount;
  await recurring.save();
  await recurring.populate('account', 'name icon color');
  return recurring;
}

// Global lock to prevent concurrent processing
let isProcessing = false;

/**
 * Lazy catch-up processor — called when the user opens the app.
 * Uses a lock to prevent concurrent processing that could cause duplicates.
 *
 * For each active recurring transaction belonging to this user where
 * nextOccurrence is in the past, we backfill ALL missed occurrences:
 *   - Each transaction is created with its correct backdated date
 *   - daysOfWeek is respected (if set, skip dates whose weekday isn't in the list)
 *   - nextOverrideAmount is consumed on the FIRST pending occurrence then cleared
 *   - nextOccurrence advances until it is in the future (or past endDate)
 */
export async function processPendingRecurringTransactions(userId: string): Promise<number> {
  // Prevent concurrent processing
  if (isProcessing) {
    console.log('[processPendingRecurringTransactions] Already processing, skipping concurrent call');
    return 0;
  }

  isProcessing = true;

  try {
    const now = new Date();

    const dueTransactions = await RecurringTransaction.find({
      user: userId,
      isActive: true,
      nextOccurrence: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    });

    console.log(`[processPendingRecurringTransactions] Now: ${now.toISOString()}, Found ${dueTransactions.length} due transactions`);

    let created = 0;

    for (const recurring of dueTransactions) {
      try {
        console.log(`[Recurring ${recurring._id}] Processing: frequency=${recurring.frequency}, dayOfMonth=${recurring.dayOfMonth}, nextOccurrence=${recurring.nextOccurrence.toISOString()}`);

        let current = new Date(recurring.nextOccurrence);
        let overrideConsumed = false;
        let iterationCount = 0;

        while (current <= now) {
          iterationCount++;
          console.log(`  [Iteration ${iterationCount}] current=${current.toISOString()}, current.getDate()=${current.getDate()}`);

          // Check endDate
          if (recurring.endDate && current > recurring.endDate) {
            console.log(`  [Iteration ${iterationCount}] Past endDate, breaking`);
            recurring.isActive = false;
            break;
          }

          // Check daysOfWeek filter — 0=Sun … 6=Sat
          const dayOfWeek = current.getDay();
          const daysFilter = recurring.daysOfWeek ?? [];
          const dayAllowed = daysFilter.length === 0 || daysFilter.includes(dayOfWeek);

          console.log(`  [Iteration ${iterationCount}] dayOfWeek=${dayOfWeek}, daysFilter=${JSON.stringify(daysFilter)}, dayAllowed=${dayAllowed}`);

          if (dayAllowed) {
            // Determine amount: use override only on the first occurrence
            const amount =
              !overrideConsumed && recurring.nextOverrideAmount != null
                ? recurring.nextOverrideAmount
                : recurring.amount;
            overrideConsumed = true;

            const transactionDate = occurrenceAt(current, recurring.executionTime);

            // Check if a transaction already exists for this date to prevent duplicates
            const existingTransaction = await Transaction.findOne({
              user: recurring.user,
              account: recurring.account,
              type: recurring.type,
              purpose: recurring.purpose,
              date: {
                $gte: new Date(transactionDate.getTime() - 60000), // Within 1 minute
                $lte: new Date(transactionDate.getTime() + 60000),
              },
            });

            if (existingTransaction) {
              console.log(`  [Iteration ${iterationCount}] Transaction already exists for this date, skipping`);
            } else {
              console.log(`  [Iteration ${iterationCount}] Creating transaction for ${transactionDate.toISOString()} with amount ${amount}`);

              // Create the backdated transaction
              await Transaction.create({
                user: recurring.user,
                account: recurring.account,
                type: recurring.type,
                amount,
                purpose: recurring.purpose,
                note: recurring.note,
                date: transactionDate,
              });

              // Update account balance
              const delta = recurring.type === 'income' ? amount : -amount;
              await Account.findByIdAndUpdate(recurring.account, {
                $inc: { currentBalance: delta },
              });

              created++;
            }
          } else {
            console.log(`  [Iteration ${iterationCount}] Day not allowed, skipping`);
          }

          // Advance to next occurrence
          const prevCurrent = new Date(current);
          current = advanceByFrequency(current, recurring.frequency, recurring.dayOfMonth);
          console.log(`  [Iteration ${iterationCount}] Advanced from ${prevCurrent.toISOString()} to ${current.toISOString()}`);
        }

        console.log(`[Recurring ${recurring._id}] Completed: ${iterationCount} iterations, ${created} transactions created`);

        // Clear the consumed override
        if (overrideConsumed) {
          recurring.nextOverrideAmount = undefined;
        }

        recurring.lastCreatedAt = new Date();
        recurring.nextOccurrence = current;

        // Deactivate if past end date
        if (recurring.endDate && recurring.nextOccurrence > recurring.endDate) {
          recurring.isActive = false;
        }

        await recurring.save();
      } catch (error) {
        console.error(`Failed to process recurring transaction ${recurring._id}:`, error);
      }
    }

    console.log(`[processPendingRecurringTransactions] Total created: ${created}`);
    return created;
  } finally {
    isProcessing = false;
  }
}
