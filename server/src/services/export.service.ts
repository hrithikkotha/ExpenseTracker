import { Transaction } from '../models/Transaction';

export async function exportToCSV(
  userId: string,
  from?: Date,
  to?: Date,
): Promise<string> {
  const filter: Record<string, unknown> = { user: userId };

  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, unknown>).$gte = from;
    if (to) (filter.date as Record<string, unknown>).$lte = to;
  }

  const transactions = await Transaction.find(filter)
    .populate('account', 'name')
    .populate('toAccount', 'name')
    .sort({ date: -1 });

  // CSV headers
  const headers = ['Date', 'Type', 'Amount', 'Purpose', 'Account', 'To Account', 'Note'];
  const rows = [headers];

  // CSV rows
  for (const txn of transactions) {
    rows.push([
      txn.date.toISOString().split('T')[0],
      txn.type,
      txn.amount.toString(),
      txn.purpose || '',
      (txn.account as any)?.name || '',
      (txn.toAccount as any)?.name || '',
      txn.note || '',
    ]);
  }

  // Convert to CSV string
  return rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}
