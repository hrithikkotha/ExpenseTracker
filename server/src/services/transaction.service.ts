import type { FilterQuery, SortOrder } from 'mongoose';
import {
  Transaction,
  type ITransaction,
  type TransactionDocument,
} from '../models/Transaction';
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

// Removed assertCategoryUsable - categories feature removed

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
  // LOGIC:
  // - If transaction.account === accountId:
  //     - income: ADD amount (money coming in)
  //     - expense: SUBTRACT amount (money going out)
  //     - transfer: SUBTRACT amount (money going to another account)
  // - If transaction.toAccount === accountId:
  //     - ADD amount (money coming from another account via transfer)
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
              // If this transaction belongs to this account (transaction.account === accountId)
              { $eq: ['$account', account._id] },
              // Then apply these rules based on transaction type:
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$type', 'income'] },
                      then: '$amount', // Income: ADD to balance
                    },
                    {
                      case: { $eq: ['$type', 'expense'] },
                      then: { $multiply: ['$amount', -1] }, // Expense: SUBTRACT from balance
                    },
                    {
                      case: { $eq: ['$type', 'transfer'] },
                      then: { $multiply: ['$amount', -1] }, // Transfer out: SUBTRACT from balance
                    },
                  ],
                  default: 0, // Unknown type: don't change balance
                },
              },
              // Else this is the toAccount (receiving a transfer)
              '$amount', // Transfer in: ADD to balance
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
  if (query.accountId) {
    filter.$or = [{ account: query.accountId }, { toAccount: query.accountId }];
  }

  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = query.from;
    if (query.to) filter.date.$lte = query.to;
  }

  // Search in both purpose and note fields
  if (query.q) {
    filter.$or = [
      { purpose: { $regex: escapeRegex(query.q), $options: 'i' } },
      { note: { $regex: escapeRegex(query.q), $options: 'i' } },
    ];
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
  await txn.populate('account', 'name icon color type');
  await txn.populate('toAccount', 'name icon color type');
  return txn;
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<TransactionDocument> {
  await assertAccountOwned(userId, input.accountId);

  const txn = await Transaction.create({
    user: userId,
    account: input.accountId,
    type: input.type,
    amount: input.amount,
    purpose: input.purpose,
    note: input.note,
    date: input.date,
  });

  // Update account balance
  await updateAccountBalance(userId, input.accountId);

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
  if (input.purpose !== undefined) txn.purpose = input.purpose;
  if (input.note !== undefined) txn.note = input.note;
  if (input.toAccountId !== undefined)
    txn.toAccount = input.toAccountId as unknown as TransactionDocument['toAccount'];
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
