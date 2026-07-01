import { Transaction, type TransactionDocument } from '../models/Transaction';
import { Account } from '../models/Account';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  date: Date;
}

export async function createTransfer(
  userId: string,
  input: CreateTransferInput,
): Promise<{ from: TransactionDocument; to: TransactionDocument }> {
  // Validate both accounts exist and belong to user
  const [fromAccount, toAccount] = await Promise.all([
    Account.findOne({ _id: input.fromAccountId, user: userId, isArchived: false }),
    Account.findOne({ _id: input.toAccountId, user: userId, isArchived: false }),
  ]);

  if (!fromAccount) throw AppError.badRequest('Invalid from account');
  if (!toAccount) throw AppError.badRequest('Invalid to account');
  if (input.fromAccountId === input.toAccountId) {
    throw AppError.badRequest('Cannot transfer to the same account');
  }

  // Create transfer pair ID
  const transferPairId = new Types.ObjectId();

  // Create outgoing transaction (from account, negative amount)
  const fromTransaction = await Transaction.create({
    user: userId,
    account: input.fromAccountId,
    type: 'transfer',
    amount: input.amount,
    toAccount: input.toAccountId,
    transferPairId,
    note: input.note,
    date: input.date,
    tags: [],
    isSplit: false,
    splits: [],
  });

  // Create incoming transaction (to account, positive amount)
  const toTransaction = await Transaction.create({
    user: userId,
    account: input.toAccountId,
    type: 'transfer',
    amount: input.amount,
    toAccount: input.fromAccountId, // Link back to origin
    transferPairId,
    note: input.note,
    date: input.date,
    tags: [],
    isSplit: false,
    splits: [],
  });

  // Update account balances
  fromAccount.currentBalance -= input.amount;
  toAccount.currentBalance += input.amount;

  await Promise.all([
    fromAccount.save(),
    toAccount.save(),
    fromTransaction.populate('account', 'name icon color'),
    fromTransaction.populate('toAccount', 'name icon color'),
    toTransaction.populate('account', 'name icon color'),
    toTransaction.populate('toAccount', 'name icon color'),
  ]);

  return { from: fromTransaction, to: toTransaction };
}

export async function deleteTransferPair(
  userId: string,
  transferPairId: string,
): Promise<void> {
  const transactions = await Transaction.find({
    user: userId,
    transferPairId: new Types.ObjectId(transferPairId),
  });

  if (transactions.length !== 2) {
    throw AppError.notFound('Transfer pair not found');
  }

  // Delete both transactions
  await Transaction.deleteMany({
    user: userId,
    transferPairId: new Types.ObjectId(transferPairId),
  });

  // Recalculate affected account balances
  const accountIds = [...new Set(transactions.map((t) => String(t.account)))];
  for (const accountId of accountIds) {
    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) continue;

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
                '$amount',
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
}
