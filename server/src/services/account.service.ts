import { Account, type AccountDocument } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/AppError';
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from '../validators/account.validators';

export async function listAccounts(
  userId: string,
  includeArchived = false,
): Promise<AccountDocument[]> {
  const filter: Record<string, unknown> = { user: userId };
  if (!includeArchived) {
    filter.isArchived = false;
  }

  const accounts = await Account.find(filter).sort({ isDefault: -1, createdAt: 1 });
  return accounts;
}

async function findOwnedOrThrow(
  userId: string,
  id: string,
): Promise<AccountDocument> {
  const account = await Account.findOne({ _id: id, user: userId });
  if (!account) throw AppError.notFound('Account not found');
  return account;
}

export async function getAccount(
  userId: string,
  id: string,
): Promise<AccountDocument> {
  return findOwnedOrThrow(userId, id);
}

export async function createAccount(
  userId: string,
  input: CreateAccountInput,
): Promise<AccountDocument> {
  // If this is the first account, make it default
  const existingCount = await Account.countDocuments({ user: userId });
  const isFirstAccount = existingCount === 0;

  const account = await Account.create({
    user: userId,
    ...input,
    isDefault: input.isDefault ?? isFirstAccount,
    currentBalance: input.openingBalance ?? 0,
  });

  return account;
}

export async function updateAccount(
  userId: string,
  id: string,
  input: UpdateAccountInput,
): Promise<AccountDocument> {
  const account = await findOwnedOrThrow(userId, id);

  Object.assign(account, input);
  await account.save();

  return account;
}

export async function deleteAccount(
  userId: string,
  id: string,
): Promise<void> {
  const account = await findOwnedOrThrow(userId, id);

  // Check if account has transactions
  const transactionCount = await Transaction.countDocuments({ account: id });

  if (transactionCount > 0) {
    // Archive instead of deleting
    account.isArchived = true;
    await account.save();
  } else {
    // Safe to hard delete
    await account.deleteOne();
  }

  // If deleted/archived account was default, set another as default
  if (account.isDefault) {
    const nextAccount = await Account.findOne({
      user: userId,
      _id: { $ne: id },
      isArchived: false,
    }).sort({ createdAt: 1 });

    if (nextAccount) {
      nextAccount.isDefault = true;
      await nextAccount.save();
    }
  }
}

export async function getAccountBalance(
  userId: string,
  accountId: string,
): Promise<number> {
  const account = await findOwnedOrThrow(userId, accountId);

  // Calculate balance from transactions
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
                  { $cond: [{ $eq: ['$type', 'expense'] }, { $multiply: ['$amount', -1] }, 0] },
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
  return account.openingBalance + calculatedBalance;
}

export async function syncAccountBalances(userId: string): Promise<void> {
  const accounts = await Account.find({ user: userId, isArchived: false });

  for (const account of accounts) {
    const newBalance = await getAccountBalance(userId, account._id.toString());
    account.currentBalance = newBalance;
    await account.save();
  }
}
