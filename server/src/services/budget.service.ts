import { Budget, type BudgetDocument } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/AppError';
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../validators/budget.validators';

interface BudgetWithSpent extends BudgetDocument {
  spent: number;
}

async function computeSpent(budget: BudgetDocument): Promise<number> {
  const match: Record<string, unknown> = {
    user: budget.user,
    type: 'expense',
  };

  if (budget.category) match.category = budget.category;

  if (budget.period === 'monthly' && budget.month) {
    const start = new Date(budget.year, budget.month - 1, 1);
    const end = new Date(budget.year, budget.month, 0, 23, 59, 59);
    match.date = { $gte: start, $lte: end };
  } else {
    const start = new Date(budget.year, 0, 1);
    const end = new Date(budget.year, 11, 31, 23, 59, 59);
    match.date = { $gte: start, $lte: end };
  }

  const result = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return result[0]?.total ?? 0;
}

export async function listBudgets(
  userId: string,
): Promise<BudgetWithSpent[]> {
  const budgets = await Budget.find({ user: userId })
    .populate('category', 'name icon color type')
    .sort({ period: 1, year: -1, month: -1 });

  const withSpent = await Promise.all(
    budgets.map(async (b) => {
      const spent = await computeSpent(b);
      return Object.assign(b.toJSON(), { spent });
    }),
  );

  return withSpent as BudgetWithSpent[];
}

async function findOwnedOrThrow(
  userId: string,
  id: string,
): Promise<BudgetDocument> {
  const budget = await Budget.findOne({ _id: id, user: userId });
  if (!budget) throw AppError.notFound('Budget not found');
  return budget;
}

export async function getBudget(
  userId: string,
  id: string,
): Promise<BudgetWithSpent> {
  const budget = await findOwnedOrThrow(userId, id);
  await budget.populate('category', 'name icon color type');
  const spent = await computeSpent(budget);
  return Object.assign(budget.toJSON(), { spent }) as BudgetWithSpent;
}

export async function createBudget(
  userId: string,
  input: CreateBudgetInput,
): Promise<BudgetWithSpent> {
  try {
    const budget = await Budget.create({
      user: userId,
      category: input.categoryId ?? null,
      amount: input.amount,
      period: input.period,
      month: input.month,
      year: input.year,
    });
    await budget.populate('category', 'name icon color type');
    const spent = await computeSpent(budget);
    return Object.assign(budget.toJSON(), { spent }) as BudgetWithSpent;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw AppError.conflict('A budget already exists for this combination');
    }
    throw err;
  }
}

export async function updateBudget(
  userId: string,
  id: string,
  input: UpdateBudgetInput,
): Promise<BudgetWithSpent> {
  const budget = await findOwnedOrThrow(userId, id);
  budget.amount = input.amount;
  await budget.save();
  await budget.populate('category', 'name icon color type');
  const spent = await computeSpent(budget);
  return Object.assign(budget.toJSON(), { spent }) as BudgetWithSpent;
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  const budget = await findOwnedOrThrow(userId, id);
  await budget.deleteOne();
}
