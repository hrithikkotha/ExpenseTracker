import type { FilterQuery, SortOrder } from 'mongoose';
import {
  Transaction,
  type ITransaction,
  type TransactionDocument,
} from '../models/Transaction';
import { Category } from '../models/Category';
import { Account } from '../models/Account';
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

/**
 * Ensures the account exists and belongs to the user.
 */
async function assertAccountOwned(
  userId: string,
  accountId: string,
): Promise<void> {
  const account = await Account.findOne({ _id: accountId, user: userId, isArchived: false });
  if (!account) {
    throw AppError.badRequest('Invalid account');
  }
}

/**
 * Updates account balance after transaction changes.
 */
async function updateAccountBalance(
  userId: string,
  accountId: string,
): Promise<void> {
  const account = await Account.findOne({ _id: accountId, user: userId });
  if (!account) return;

  // Recalculate balance from transactions
  const result = await Transaction.aggregate([
    {
      $match: {
        user: account.user,
        $or: [{ account: account._id }, { toAccount: account._id }],
      },
    },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              { $eq: ['$account', account._id] },
              {
                $cond: [
                  { $eq: ['$type', 'income'] },
                  '$amount',
                  { $cond: [{ $eq: ['$type', 'expense'] }, { $multiply: ['$amount', -1] }, { $multiply: ['$amount', -1] }] },
                ],
              },
              '$amount', // toAccount (transfer in)
            ],
          },
        },
      },
    },
  ]);

  const calculatedBalance = result[0]?.balance ?? 0;
  account.currentBalance = account.openingBalance + calculatedBalance;
  await account.save();
}

export async function listTransactions(
  userId: string,
  query: ListTransactionsQuery,
): Promise<{ items: TransactionDocument[]; meta: PaginationMeta }> {
  const filter: FilterQuery<ITransaction> = { user: userId };

  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.category = query.categoryId;
  if (query.accountId) {
    filter.$or = [{ account: query.accountId }, { toAccount: query.accountId }];
  }

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
      .populate('category', 'name icon color type')
      .populate('account', 'name icon color type')
      .populate('toAccount', 'name icon color type'),
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
  await txn.populate('account', 'name icon color type');
  await txn.populate('toAccount', 'name icon color type');
  return txn;
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<TransactionDocument> {
  // Only validate category if provided (categories are now optional)
  if (input.categoryId) {
    await assertCategoryUsable(userId, input.categoryId, input.type);
  }
  await assertAccountOwned(userId, input.accountId);

  const txn = await Transaction.create({
    user: userId,
    account: input.accountId,
    type: input.type,
    amount: input.amount,
    category: input.categoryId || undefined, // Optional - categories feature removed
    note: input.note,
    date: input.date,
  });

  // Update account balance
  await updateAccountBalance(userId, input.accountId);

  await txn.populate('category', 'name icon color type');
  await txn.populate('account', 'name icon color type');
  return txn;
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionDocument> {
  const txn = await findOwnedOrThrow(userId, id);

  const oldAccountId = String(txn.account);

  // The effective type/category after the update must remain consistent.
  const nextType = input.type ?? txn.type;
  const nextCategory = input.categoryId ?? String(txn.category);
  if ((input.type !== undefined || input.categoryId !== undefined) && nextType !== 'transfer') {
    await assertCategoryUsable(userId, nextCategory, nextType as 'income' | 'expense');
  }

  if (input.accountId !== undefined) {
    await assertAccountOwned(userId, input.accountId);
  }

  if (input.toAccountId !== undefined && input.toAccountId) {
    await assertAccountOwned(userId, input.toAccountId);
  }

  if (input.type !== undefined) txn.type = input.type as TransactionDocument['type'];
  if (input.amount !== undefined) txn.amount = input.amount;
  if (input.accountId !== undefined)
    txn.account = input.accountId as unknown as TransactionDocument['account'];
  if (input.categoryId !== undefined)
    txn.category = nextCategory as unknown as TransactionDocument['category'];
  if (input.toAccountId !== undefined)
    txn.toAccount = input.toAccountId as unknown as TransactionDocument['toAccount'];
  if (input.note !== undefined) txn.note = input.note;
  if (input.date !== undefined) txn.date = input.date;

  await txn.save();

  // Update balances for both old and new accounts
  await updateAccountBalance(userId, oldAccountId);
  if (input.accountId && input.accountId !== oldAccountId) {
    await updateAccountBalance(userId, input.accountId);
  }
  if (input.toAccountId) {
    await updateAccountBalance(userId, input.toAccountId);
  }

  await txn.populate('category', 'name icon color type');
  await txn.populate('account', 'name icon color type');
  await txn.populate('toAccount', 'name icon color type');
  return txn;
}

export async function deleteTransaction(
  userId: string,
  id: string,
): Promise<void> {
  const txn = await findOwnedOrThrow(userId, id);
  const accountId = String(txn.account);
  const toAccountId = txn.toAccount ? String(txn.toAccount) : null;

  await txn.deleteOne();

  // Recalculate account balances
  await updateAccountBalance(userId, accountId);
  if (toAccountId) {
    await updateAccountBalance(userId, toAccountId);
  }
}
