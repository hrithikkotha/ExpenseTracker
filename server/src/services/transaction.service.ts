import { Transaction, type TransactionDocument } from '../models/Transaction';
import { Category } from '../models/Category';
import { AppError } from '../utils/AppError';
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../validators/transaction.validators';

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
): Promise<TransactionDocument[]> {
  // Full search/filter/sort/pagination arrives in Phase 4.
  return Transaction.find({ user: userId })
    .sort({ date: -1, createdAt: -1 })
    .populate('category', 'name icon color type');
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
