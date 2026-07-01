import {
  RecurringTransaction,
  type RecurringTransactionDocument,
  type RecurrenceFrequency,
} from '../models/RecurringTransaction';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { Category } from '../models/Category';
import { AppError } from '../utils/AppError';
import type { CreateRecurringTransactionInput, UpdateRecurringTransactionInput } from '../validators/recurringTransaction.validators';

function calculateNextOccurrence(
  date: Date,
  frequency: RecurrenceFrequency,
): Date {
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

export async function listRecurringTransactions(
  userId: string,
  includeInactive = false,
): Promise<RecurringTransactionDocument[]> {
  const filter: Record<string, unknown> = { user: userId };
  if (!includeInactive) {
    filter.isActive = true;
  }

  return RecurringTransaction.find(filter)
    .populate('category', 'name icon color type')
    .populate('account', 'name icon color')
    .sort({ nextOccurrence: 1 });
}

export async function getRecurringTransaction(
  userId: string,
  id: string,
): Promise<RecurringTransactionDocument> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId })
    .populate('category', 'name icon color type')
    .populate('account', 'name icon color');

  if (!recurring) throw AppError.notFound('Recurring transaction not found');
  return recurring;
}

export async function createRecurringTransaction(
  userId: string,
  input: CreateRecurringTransactionInput,
): Promise<RecurringTransactionDocument> {
  // Validate account exists
  const account = await Account.findOne({ _id: input.accountId, user: userId });
  if (!account) throw AppError.badRequest('Invalid account');

  // Validate category exists and type matches
  const category = await Category.findById(input.categoryId);
  if (!category || (!category.isDefault && String(category.user) !== userId)) {
    throw AppError.badRequest('Invalid category');
  }
  if (category.type !== input.type) {
    throw AppError.badRequest(`Category "${category.name}" is for ${category.type}, not ${input.type}`);
  }

  const startDate = new Date(input.startDate);
  const nextOccurrence = calculateNextOccurrence(startDate, input.frequency);

  const recurring = await RecurringTransaction.create({
    user: userId,
    account: input.accountId,
    type: input.type,
    amount: input.amount,
    category: input.categoryId,
    note: input.note,
    frequency: input.frequency,
    startDate,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
    nextOccurrence,
    isActive: true,
  });

  await recurring.populate('category', 'name icon color type');
  await recurring.populate('account', 'name icon color');
  return recurring;
}

export async function updateRecurringTransaction(
  userId: string,
  id: string,
  input: UpdateRecurringTransactionInput,
): Promise<RecurringTransactionDocument> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) throw AppError.notFound('Recurring transaction not found');

  if (input.accountId) {
    const account = await Account.findOne({ _id: input.accountId, user: userId });
    if (!account) throw AppError.badRequest('Invalid account');
    recurring.account = input.accountId as any;
  }

  if (input.categoryId || input.type) {
    const nextType = input.type ?? recurring.type;
    const nextCategory = input.categoryId ?? String(recurring.category);
    const category = await Category.findById(nextCategory);
    if (!category || (!category.isDefault && String(category.user) !== userId)) {
      throw AppError.badRequest('Invalid category');
    }
    if (category.type !== nextType) {
      throw AppError.badRequest(`Category mismatch`);
    }
    if (input.categoryId) recurring.category = input.categoryId as any;
    if (input.type) recurring.type = input.type;
  }

  if (input.amount !== undefined) recurring.amount = input.amount;
  if (input.note !== undefined) recurring.note = input.note;
  if (input.isActive !== undefined) recurring.isActive = input.isActive;

  if (input.frequency) {
    recurring.frequency = input.frequency;
    recurring.nextOccurrence = calculateNextOccurrence(recurring.nextOccurrence, input.frequency);
  }

  if (input.startDate) recurring.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) {
    recurring.endDate = input.endDate ? new Date(input.endDate) : undefined;
  }

  await recurring.save();
  await recurring.populate('category', 'name icon color type');
  await recurring.populate('account', 'name icon color');
  return recurring;
}

export async function deleteRecurringTransaction(
  userId: string,
  id: string,
): Promise<void> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) throw AppError.notFound('Recurring transaction not found');
  await recurring.deleteOne();
}

export async function skipNextOccurrence(
  userId: string,
  id: string,
): Promise<RecurringTransactionDocument> {
  const recurring = await RecurringTransaction.findOne({ _id: id, user: userId });
  if (!recurring) throw AppError.notFound('Recurring transaction not found');

  recurring.nextOccurrence = calculateNextOccurrence(recurring.nextOccurrence, recurring.frequency);
  await recurring.save();
  await recurring.populate('category', 'name icon color type');
  await recurring.populate('account', 'name icon color');
  return recurring;
}

// Called by cron job
export async function processRecurringTransactions(): Promise<number> {
  const now = new Date();

  const dueTransactions = await RecurringTransaction.find({
    isActive: true,
    nextOccurrence: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: now } },
    ],
  });

  let created = 0;
  for (const recurring of dueTransactions) {
    try {
      // Create actual transaction
      await Transaction.create({
        user: recurring.user,
        account: recurring.account,
        type: recurring.type,
        amount: recurring.amount,
        category: recurring.category,
        note: recurring.note,
        date: recurring.nextOccurrence,
      });

      // Update next occurrence
      recurring.lastCreatedAt = new Date();
      recurring.nextOccurrence = calculateNextOccurrence(
        recurring.nextOccurrence,
        recurring.frequency
      );

      // Deactivate if past end date
      if (recurring.endDate && recurring.nextOccurrence > recurring.endDate) {
        recurring.isActive = false;
      }

      await recurring.save();
      created++;
    } catch (error) {
      console.error(`Failed to process recurring transaction ${recurring._id}:`, error);
    }
  }

  return created;
}
