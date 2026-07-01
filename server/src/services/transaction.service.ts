import type { FilterQuery, SortOrder } from 'mongoose';
import {
  Transaction,
  type ITransaction,
  type TransactionDocument,
} from '../models/Transaction';
import { Category } from '../models/Category';
import { AppError } from '../utils/AppError';
import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from '../validators/transaction.validators';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Escapes user input so it can be safely used inside a RegExp. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ensures the category exists, is usable by this user (owned or a system
 * default), and its type matches the transaction type. Returns nothing;
 * throws AppError otherwise.
 */
async function assertCategoryUsable(
  userId: string,
  categoryId: string,
  txnType: 'income' | 'expense',
): Promise<void> {
  const category = await Category.findById(categoryId);
  const usable =
    category && (category.isDefault || String(category.user) === userId);
  if (!usable) {
    throw AppError.badRequest('Invalid category');
  }
  if (category.type !== txnType) {
    throw AppError.badRequest(
      `Category "${category.name}" is an ${category.type} category, not ${txnType}`,
    );
  }
}

export async function listTransactions(
  userId: string,
  query: ListTransactionsQuery,
): Promise<{ items: TransactionDocument[]; meta: PaginationMeta }> {
  const filter: FilterQuery<ITransaction> = { user: userId };

  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.category = query.categoryId;

  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = query.from;
    if (query.to) filter.date.$lte = query.to;
  }

  if (query.q) {
    filter.note = { $regex: escapeRegex(query.q), $options: 'i' };
  }

  // Parse "-field" / "field" into a Mongoose sort spec, with a stable
  // secondary tiebreaker so pagination is deterministic.
  const desc = query.sort.startsWith('-');
  const field = query.sort.replace(/^-/, '');
  const sort: Record<string, SortOrder> = {
    [field]: desc ? -1 : 1,
    _id: -1,
  };

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .populate('category', 'name icon color type'),
    Transaction.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

async function findOwnedOrThrow(
  userId: string,
  id: string,
): Promise<TransactionDocument> {
  const txn = await Transaction.findOne({ _id: id, user: userId });
  if (!txn) throw AppError.notFound('Transaction not found');
  return txn;
}

export async function getTransaction(
  userId: string,
  id: string,
): Promise<TransactionDocument> {
  const txn = await findOwnedOrThrow(userId, id);
  await txn.populate('category', 'name icon color type');
  return txn;
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<TransactionDocument> {
  await assertCategoryUsable(userId, input.categoryId, input.type);

  const txn = await Transaction.create({
    user: userId,
    type: input.type,
    amount: input.amount,
    category: input.categoryId,
    note: input.note,
    date: input.date,
  });
  await txn.populate('category', 'name icon color type');
  return txn;
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionDocument> {
  const txn = await findOwnedOrThrow(userId, id);

  // The effective type/category after the update must remain consistent.
  const nextType = input.type ?? txn.type;
  const nextCategory = input.categoryId ?? String(txn.category);
  if (input.type !== undefined || input.categoryId !== undefined) {
    await assertCategoryUsable(userId, nextCategory, nextType);
  }

  if (input.type !== undefined) txn.type = input.type;
  if (input.amount !== undefined) txn.amount = input.amount;
  if (input.categoryId !== undefined)
    txn.category = nextCategory as unknown as TransactionDocument['category'];
  if (input.note !== undefined) txn.note = input.note;
  if (input.date !== undefined) txn.date = input.date;

  await txn.save();
  await txn.populate('category', 'name icon color type');
  return txn;
}

export async function deleteTransaction(
  userId: string,
  id: string,
): Promise<void> {
  const txn = await findOwnedOrThrow(userId, id);
  await txn.deleteOne();
}
