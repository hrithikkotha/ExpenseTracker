/**
 * Phase 3 end-to-end transaction verification (throwaway dev script).
 * Run: npx tsx scripts/verify-transactions.ts
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  const ok = cond ? '✅' : '❌';
  if (!cond) failures++;
  // eslint-disable-next-line no-console
  console.log(`${ok} ${name}${extra ? ` — ${extra}` : ''}`);
}

async function registerUser(base: string, email: string) {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, password: 'secret123' }),
  });
  const body = await res.json();
  if (!body?.data?.accessToken) {
    // eslint-disable-next-line no-console
    console.error('register failed', res.status, JSON.stringify(body));
    throw new Error('register failed');
  }
  return body.data.accessToken as string;
}

async function main() {
  const mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('expense_tracker_test');
  process.env.NODE_ENV = 'development';

  const { connectDB, disconnectDB } = await import('../src/config/db');
  const { createApp } = await import('../src/app');
  const { Category } = await import('../src/models/Category');
  const { DEFAULT_CATEGORIES } = await import(
    '../src/config/defaultCategories'
  );

  await connectDB();
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { user: null, type: cat.type, name: cat.name },
      { $setOnInsert: { ...cat, user: null, isDefault: true } },
      { upsert: true },
    );
  }
  const expenseCat = await Category.findOne({ type: 'expense', user: null });
  const incomeCat = await Category.findOne({ type: 'income', user: null });

  const app = createApp();
  const server = app.listen(4102);
  const base = 'http://localhost:4102/api/v1';
  const json = (t: string) => ({
    authorization: `Bearer ${t}`,
    'content-type': 'application/json',
  });
  const auth = (t: string) => ({ authorization: `Bearer ${t}` });

  try {
    const tokenA = await registerUser(base, 'a@example.com');
    const tokenB = await registerUser(base, 'b@example.com');

    // 1. Create expense
    const createRes = await fetch(`${base}/transactions`, {
      method: 'POST',
      headers: json(tokenA),
      body: JSON.stringify({
        type: 'expense',
        amount: 42.5,
        categoryId: String(expenseCat!._id),
        note: 'Lunch',
        date: '2026-06-15',
      }),
    });
    const created = await createRes.json();
    check('create expense → 201', createRes.status === 201, `got ${createRes.status}`);
    check('populated category returned', created.data?.category?.name === expenseCat!.name);
    check('amount stored precisely', created.data?.amount === 42.5);
    const txnId = created.data._id;

    // 2. Type/category mismatch → 400
    const mismatchRes = await fetch(`${base}/transactions`, {
      method: 'POST',
      headers: json(tokenA),
      body: JSON.stringify({
        type: 'income',
        amount: 10,
        categoryId: String(expenseCat!._id), // expense category on an income txn
        date: '2026-06-15',
      }),
    });
    check('type/category mismatch → 400', mismatchRes.status === 400, `got ${mismatchRes.status}`);

    // 3. Invalid amount (<= 0) → 400
    const badAmountRes = await fetch(`${base}/transactions`, {
      method: 'POST',
      headers: json(tokenA),
      body: JSON.stringify({
        type: 'expense',
        amount: 0,
        categoryId: String(expenseCat!._id),
        date: '2026-06-15',
      }),
    });
    check('amount <= 0 → 400', badAmountRes.status === 400, `got ${badAmountRes.status}`);

    // 4. List returns the created txn
    const listRes = await fetch(`${base}/transactions`, { headers: auth(tokenA) });
    const list = await listRes.json();
    check('list → 200 with 1 txn', listRes.status === 200 && list.data.length === 1, `got ${list.data.length}`);

    // 5. Update amount + note
    const updRes = await fetch(`${base}/transactions/${txnId}`, {
      method: 'PATCH',
      headers: json(tokenA),
      body: JSON.stringify({ amount: 50, note: 'Team lunch' }),
    });
    const upd = await updRes.json();
    check('update → 200', updRes.status === 200);
    check('update applied', upd.data?.amount === 50 && upd.data?.note === 'Team lunch');

    // 6. Switch to income requires a matching category (mismatch → 400)
    const switchBad = await fetch(`${base}/transactions/${txnId}`, {
      method: 'PATCH',
      headers: json(tokenA),
      body: JSON.stringify({ type: 'income' }), // still points at an expense category
    });
    check('switch type w/o matching category → 400', switchBad.status === 400, `got ${switchBad.status}`);

    // 7. Switch type WITH matching income category → 200
    const switchGood = await fetch(`${base}/transactions/${txnId}`, {
      method: 'PATCH',
      headers: json(tokenA),
      body: JSON.stringify({ type: 'income', categoryId: String(incomeCat!._id) }),
    });
    check('switch type w/ matching category → 200', switchGood.status === 200, `got ${switchGood.status}`);

    // 8. Cross-user access → 404
    const crossRes = await fetch(`${base}/transactions/${txnId}`, {
      headers: auth(tokenB),
    });
    check('cross-user get → 404', crossRes.status === 404, `got ${crossRes.status}`);

    // 9. Deleting an in-use category → 409 (create a custom category + txn first)
    const catRes = await fetch(`${base}/categories`, {
      method: 'POST',
      headers: json(tokenA),
      body: JSON.stringify({ name: 'Gadgets', type: 'expense' }),
    });
    const customCat = (await catRes.json()).data;
    await fetch(`${base}/transactions`, {
      method: 'POST',
      headers: json(tokenA),
      body: JSON.stringify({
        type: 'expense',
        amount: 99,
        categoryId: customCat._id,
        date: '2026-06-16',
      }),
    });
    const delCatRes = await fetch(`${base}/categories/${customCat._id}`, {
      method: 'DELETE',
      headers: auth(tokenA),
    });
    check('delete in-use category → 409', delCatRes.status === 409, `got ${delCatRes.status}`);

    // 10. Delete transaction → 204
    const delRes = await fetch(`${base}/transactions/${txnId}`, {
      method: 'DELETE',
      headers: auth(tokenA),
    });
    check('delete txn → 204', delRes.status === 204, `got ${delRes.status}`);

    // 11. Unauthenticated → 401
    const noAuth = await fetch(`${base}/transactions`);
    check('list without auth → 401', noAuth.status === 401, `got ${noAuth.status}`);
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
