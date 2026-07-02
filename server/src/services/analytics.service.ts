import type { PipelineStage } from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Types } from 'mongoose';
import type { SummaryQuery, TrendsQuery } from '../validators/analytics.validators';

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
}

interface TrendPoint {
  period: string; // "2026-03" (monthly) or "2026" (yearly)
  income: number;
  expense: number;
}

export type Trends = TrendPoint[];

export interface CalendarDayData {
  date: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export async function getCalendarData(
  userId: string,
  month: Date,
): Promise<CalendarDayData[]> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const result = await Transaction.aggregate([
    {
      $match: {
        user: new Types.ObjectId(userId),
        date: { $gte: startOfMonth, $lte: endOfMonth },
        type: { $in: ['income', 'expense'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        date: '$_id',
        income: 1,
        expense: 1,
        net: { $subtract: ['$income', '$expense'] },
        count: 1,
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return result;
}

export async function getSummary(
  userId: string,
  query: SummaryQuery,
): Promise<Summary> {
  const match: PipelineStage.Match['$match'] = {
    user: new Types.ObjectId(userId)
  };
  if (query.from || query.to) {
    match.date = {};
    if (query.from) match.date.$gte = query.from;
    if (query.to) match.date.$lte = query.to;
  }

  // Total income and expense
  const totals = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const totalIncome = totals.find((t) => t._id === 'income')?.total ?? 0;
  const totalExpense = totals.find((t) => t._id === 'expense')?.total ?? 0;
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    balance,
    savingsRate,
  };
}

export async function getTrends(
  userId: string,
  query: TrendsQuery,
): Promise<Trends> {
  const now = new Date();
  const currentYear = query.year ?? now.getFullYear();
  const userObjectId = new Types.ObjectId(userId);

  let match: PipelineStage.Match['$match'];
  let groupId: Record<string, unknown>;
  let periodFormat: string;

  if (query.period === 'yearly') {
    // Last 5 years centered on the requested year
    const start = new Date(`${currentYear - 2}-01-01`);
    const end = new Date(`${currentYear + 2}-12-31T23:59:59`);
    match = { user: userObjectId, date: { $gte: start, $lte: end } };
    groupId = { year: { $year: '$date' } };
    periodFormat = 'year';
  } else {
    // 12 months of the requested year
    const start = new Date(`${currentYear}-01-01`);
    const end = new Date(`${currentYear}-12-31T23:59:59`);
    match = { user: userObjectId, date: { $gte: start, $lte: end } };
    groupId = { year: { $year: '$date' }, month: { $month: '$date' } };
    periodFormat = 'month';
  }

  const agg = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { type: '$type', ...groupId },
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Build a map of period -> {income, expense}
  const map = new Map<string, { income: number; expense: number }>();

  for (const row of agg) {
    let key: string;
    if (periodFormat === 'year') {
      key = String(row._id.year);
    } else {
      key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
    }

    if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
    const entry = map.get(key)!;
    if (row._id.type === 'income') entry.income = row.total;
    else entry.expense = row.total;
  }

  // Zero-fill missing periods
  let periods: string[];
  if (periodFormat === 'year') {
    periods = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      periods.push(String(y));
    }
  } else {
    periods = [];
    for (let m = 1; m <= 12; m++) {
      periods.push(`${currentYear}-${String(m).padStart(2, '0')}`);
    }
  }

  return periods.map((p) => ({
    period: p,
    income: map.get(p)?.income ?? 0,
    expense: map.get(p)?.expense ?? 0,
  }));
}
