/**
 * Phase 4 end-to-end filter/sort/paginate verification (throwaway dev script).
 * Run: npx tsx scripts/verify-filters.ts
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  const ok = cond ? '✅' : '❌';
  if (!cond) failures++;
  // eslint-disable-next-line no-console
  console.log(`${ok} ${name}${extra ? ` — ${extra}` : ''}`);
}

async function main() {
  const mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('expense_tracker_test');
  process.env.NODE_ENV = 'development';

  const { connectDB, disconnectDB } = await import('../src/config/db');
  const { createApp } = await import('../src/app');
  const { Category } = await import('../src/models/Category');
  const { DEFAULT_CATEGORIES } = await import('../src/config/defaultCategories');

  await connectDB();
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { user: null, type: cat.type, name: cat.name },
      { $setOnInsert: { ...cat, user: null, isDefault: true } },
      { upsert: true },
    );
  }
  const expCat = await Category.findOne({ type: 'expense', user: null });
  const incCat = await Category.findOne({ type: 'income', user: null });

  const app = createApp();
  const server = app.listen(4103);
  const base = 'http://localhost:4103/api/v1';

  const reg = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Filter User', email: 'f@example.com', password: 'secret123' }),
  });
  const token = (await reg.json()).data.accessToken as string;
  const json = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const auth = { authorization: `Bearer ${token}` };

  // Seed 25 expenses + 5 incomes across a date range, varying amounts/notes.
  async function addTxn(
    type: 'income' | 'expense',
    amount: number,
    day: number,
    note: string,
    catId: string,
  ) {
    await fetch(`${base}/transactions`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({
        type,
        amount,
        categoryId: catId,
        date: `2026-03-${String(day).padStart(2, '0')}`,
        note,
      }),
    });
  }

  try {
    for (let i = 1; i <= 25; i++) {
      await addTxn('expense', i, i, i % 2 === 0 ? 'coffee run' : 'misc', String(expCat!._id));
    }
    for (let i = 1; i <= 5; i++) {
      await addTxn('income', 100 * i, i, 'paycheck', String(incCat!._id));
    }

    const get = async (qs: string) => {
      const res = await fetch(`${base}/transactions?${qs}`, { headers: auth });
      return { status: res.status, body: await res.json() };
    };

    // 1. Pagination meta
    const p1 = await get('page=1&limit=10');
    check('page 1 → 10 items', p1.body.data.length === 10, `got ${p1.body.data.length}`);
    check('meta.total = 30', p1.body.meta.total === 30, `got ${p1.body.meta.total}`);
    check('meta.totalPages = 3', p1.body.meta.totalPages === 3, `got ${p1.body.meta.totalPages}`);

    const p3 = await get('page=3&limit=10');
    check('page 3 → 10 items', p3.body.data.length === 10, `got ${p3.body.data.length}`);

    // 2. Type filter
    const inc = await get('type=income&limit=100');
    check('type=income → 5 items', inc.body.data.length === 5, `got ${inc.body.data.length}`);
    check('all income', inc.body.data.every((t: { type: string }) => t.type === 'income'));

    // 3. Category filter
    const byCat = await get(`categoryId=${incCat!._id}&limit=100`);
    check('category filter → 5', byCat.body.data.length === 5, `got ${byCat.body.data.length}`);

    // 4. Date range (days 10..20 inclusive → 11 expenses)
    const range = await get('from=2026-03-10&to=2026-03-20&type=expense&limit=100');
    check('date range → 11 items', range.body.data.length === 11, `got ${range.body.data.length}`);

    // 5. Search note (case-insensitive) — "coffee" on even days 2..24 = 12
    const search = await get('q=COFFEE&limit=100');
    check('search q=COFFEE → 12', search.body.data.length === 12, `got ${search.body.data.length}`);

    // 6. Sort amount ascending
    const asc = await get('type=expense&sort=amount&limit=100');
    check('sort=amount asc first=1', asc.body.data[0].amount === 1, `got ${asc.body.data[0].amount}`);
    // 7. Sort amount descending
    const desc = await get('type=expense&sort=-amount&limit=100');
    check('sort=-amount desc first=25', desc.body.data[0].amount === 25, `got ${desc.body.data[0].amount}`);

    // 8. Invalid sort field → 400
    const badSort = await get('sort=hackme');
    check('invalid sort → 400', badSort.status === 400, `got ${badSort.status}`);

    // 9. limit over cap → 400
    const badLimit = await get('limit=500');
    check('limit > 100 → 400', badLimit.status === 400, `got ${badLimit.status}`);

    // 10. Combined filter + sort + page
    const combo = await get('type=expense&from=2026-03-01&to=2026-03-31&sort=-amount&page=2&limit=10');
    check('combined query → 200', combo.status === 200, `got ${combo.status}`);
    check('combined page 2 count = 10', combo.body.data.length === 10, `got ${combo.body.data.length}`);
    // page 2 of desc amounts (25..1) starts at 15
    check('combined page 2 first amount = 15', combo.body.data[0].amount === 15, `got ${combo.body.data[0].amount}`);
  } finally {
    server.close();
    await disconnectDB();
    await mem.stop();
  }

  // eslint-disable-next-line no-console
  console.log(`\n${failures === 0 ? '🎉 All checks passed' : `💥 ${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
