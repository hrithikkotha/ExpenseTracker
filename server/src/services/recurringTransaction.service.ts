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
 * Advance a date by one frequency interval.
 */
function advanceByFrequency(date: Date, frequency: RecurrenceFrequency): Date {
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
      next.setMonth(next.getMonth() + 1);
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

  const recurring = await RecurringTransaction.create({
    user: userId,
    account: input.accountId,
    type: input.type,
    amount: input.amount,
    purpose: input.purpose,
    note: input.note,
    frequency: input.frequency,
    daysOfWeek: input.daysOfWeek ?? [],
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

/**
 * Lazy catch-up processor — called when the user opens the app.
 *
 * For each active recurring transaction belonging to this user where
 * nextOccurrence is in the past, we backfill ALL missed occurrences:
 *   - Each transaction is created with its correct backdated date
 *   - daysOfWeek is respected (if set, skip dates whose weekday isn't in the list)
 *   - nextOverrideAmount is consumed on the FIRST pending occurrence then cleared
 *   - nextOccurrence advances until it is in the future (or past endDate)
 */
export async function processPendingRecurringTransactions(userId: string): Promise<number> {
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

  let created = 0;

  for (const recurring of dueTransactions) {
    try {
      let current = new Date(recurring.nextOccurrence);
      let overrideConsumed = false;

      while (current <= now) {
        // Check endDate
        if (recurring.endDate && current > recurring.endDate) {
          recurring.isActive = false;
          break;
        }

        // Check daysOfWeek filter — 0=Sun … 6=Sat
        const dayOfWeek = current.getDay();
        const daysFilter = recurring.daysOfWeek ?? [];
        const dayAllowed = daysFilter.length === 0 || daysFilter.includes(dayOfWeek);

        if (dayAllowed) {
          // Determine amount: use override only on the first occurrence
          const amount =
            !overrideConsumed && recurring.nextOverrideAmount != null
              ? recurring.nextOverrideAmount
              : recurring.amount;
          overrideConsumed = true;

          // Create the backdated transaction
          await Transaction.create({
            user: recurring.user,
            account: recurring.account,
            type: recurring.type,
            amount,
            purpose: recurring.purpose,
            note: recurring.note,
            date: occurrenceAt(current, recurring.executionTime),
          });

          // Update account balance
          const delta = recurring.type === 'income' ? amount : -amount;
          await Account.findByIdAndUpdate(recurring.account, {
            $inc: { currentBalance: delta },
          });

          created++;
        }

        // Advance to next occurrence
        current = advanceByFrequency(current, recurring.frequency);
      }

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

  return created;
}
