/**
 * Phase 2 end-to-end category verification (throwaway dev script).
 * Boots the real app on in-memory Mongo, seeds defaults, and exercises the
 * category CRUD rules including default-protection and cross-user isolation.
 * Run: npx tsx scripts/verify-categories.ts
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

  // Seed defaults (same logic as scripts/seed.ts).
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { user: null, type: cat.type, name: cat.name },
      { $setOnInsert: { ...cat, user: null, isDefault: true } },
      { upsert: true },
    );
  }

  const app = createApp();
  const server = app.listen(4101);
  const base = 'http://localhost:4101/api/v1';

  const auth = (t: string) => ({ authorization: `Bearer ${t}` });
  const json = (t: string) => ({
    authorization: `Bearer ${t}`,
    'content-type': 'application/json',
  });

  try {
    const tokenA = await registerUser(base, 'a@example.com');
    const tokenB = await registerUser(base, 'b@example.com');

    // 1. List returns seeded defaults
    const listRes = await fetch(`${base}/categories`, { headers: auth(tokenA) });
    const list = await listRes.json();
    check('list → 200', listRes.status === 200);
    check(
      'list returns seeded defaults',
      list.data.length === DEFAULT_CATEGORIES.length,
      `got ${list.data.length}`,
    );
    check('all listed are defaults for new user', list.data.every((c: { isDefault: boolean }) => c.isDefault));

    // 2. Filter by type
    const expRes = await fetch(`${base}/categories?type=expense`, {
      headers: auth(tokenA),
    });
    const exp = await expRes.json();
    check(
      'filter type=expense',
      exp.data.every((c: { type: string }) => c.type === 'expense'),
    );

    // 3. Create a custom category
    const createRes = await fetch(`${base}/categories`, {
      method: 'POST',
      headers: json(tokenA),
      body: JSON.stringify({ name: 'Coffee', type: 'expense', icon: '☕', color: '#7c3a40' }),
    });
    const created = await createRes.json();
    check('create → 201', createRes.status === 201, `got ${createRes.status}`);
    check('created is owned (not default)', created.data?.isDefault === false);
    const customId = created.data._id;

    // 4. Duplicate name+type → 409
    const dupRes = await fetch(`${base}/categories`, {
      method: 'POST',
      headers: json(tokenA),
      body: JSON.stringify({ name: 'Coffee', type: 'expense' }),
    });
    check('duplicate category → 409', dupRes.status === 409, `got ${dupRes.status}`);

    // 5. Update own category
    const updRes = await fetch(`${base}/categories/${customId}`, {
      method: 'PATCH',
      headers: json(tokenA),
      body: JSON.stringify({ name: 'Coffee & Tea' }),
    });
    const upd = await updRes.json();
    check('update own → 200', updRes.status === 200);
    check('update applied', upd.data?.name === 'Coffee & Tea');

    // 6. Cannot edit a system default (→ 404)
    const aDefault = list.data.find((c: { isDefault: boolean }) => c.isDefault);
    const editDefaultRes = await fetch(`${base}/categories/${aDefault._id}`, {
      method: 'PATCH',
      headers: json(tokenA),
      body: JSON.stringify({ name: 'Hacked' }),
    });
    check('edit default → 404', editDefaultRes.status === 404, `got ${editDefaultRes.status}`);

    // 7. Cannot delete a system default (→ 404)
    const delDefaultRes = await fetch(`${base}/categories/${aDefault._id}`, {
      method: 'DELETE',
      headers: auth(tokenA),
    });
    check('delete default → 404', delDefaultRes.status === 404, `got ${delDefaultRes.status}`);

    // 8. User B cannot touch User A's custom category (→ 404)
    const crossRes = await fetch(`${base}/categories/${customId}`, {
      method: 'PATCH',
      headers: json(tokenB),
      body: JSON.stringify({ name: 'Stolen' }),
    });
    check('cross-user edit → 404', crossRes.status === 404, `got ${crossRes.status}`);

    // 9. User B does not see User A's custom category
    const listBRes = await fetch(`${base}/categories`, { headers: auth(tokenB) });
    const listB = await listBRes.json();
    check(
      'user B sees only defaults (not A\'s custom)',
      !listB.data.some((c: { _id: string }) => c._id === customId),
    );

    // 10. Delete own category → 204
    const delOwnRes = await fetch(`${base}/categories/${customId}`, {
      method: 'DELETE',
      headers: auth(tokenA),
    });
    check('delete own → 204', delOwnRes.status === 204, `got ${delOwnRes.status}`);

    // 11. Unauthenticated → 401
    const noAuthRes = await fetch(`${base}/categories`);
    check('list without auth → 401', noAuthRes.status === 401, `got ${noAuthRes.status}`);
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
