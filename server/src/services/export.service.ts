import { Transaction } from '../models/Transaction';

function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export async function exportToCSV(
  userId: string,
  from?: Date,
  to?: Date,
): Promise<string | null> {
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

  if (transactions.length === 0) return null;

  const headers = ['Date', 'Type', 'Amount', 'Purpose', 'Account', 'To Account', 'Note'];

  const lines: string[] = [headers.map(h => `"${h}"`).join(',')];

  for (const txn of transactions) {
    const row = [
      formatDate(txn.date),
      `"${txn.type}"`,
      txn.amount.toString(),
      `"${(txn.purpose || '').replace(/"/g, '""')}"`,
      `"${((txn.account as any)?.name || '').replace(/"/g, '""')}"`,
      `"${((txn.toAccount as any)?.name || '').replace(/"/g, '""')}"`,
      `"${(txn.note || '').replace(/"/g, '""')}"`,
    ];
    lines.push(row.join(','));
  }

  // UTF-8 BOM for Excel to recognize encoding
  return '\uFEFF' + lines.join('\n');
}
