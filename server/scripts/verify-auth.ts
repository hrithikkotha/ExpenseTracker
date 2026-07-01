/**
 * Phase 1 end-to-end auth verification (throwaway dev script).
 * Boots the real Express app against an in-memory MongoDB and exercises the
 * full auth lifecycle over HTTP. Run with: npx tsx scripts/verify-auth.ts
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  const ok = cond ? '✅' : '❌';
  if (!cond) failures++;
  // eslint-disable-next-line no-console
  console.log(`${ok} ${name}${extra ? ` — ${extra}` : ''}`);
}

function cookieFrom(res: Response): string | undefined {
  const cookies = res.headers.getSetCookie();
  const rt = cookies.find((c) => c.startsWith('et_rt='));
  return rt?.split(';')[0]; // "et_rt=<value>"
}

async function main() {
  const mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('expense_tracker_test');
  process.env.NODE_ENV = 'development';
  process.env.PORT = '4100';

  // Import AFTER env is set (env.ts validates at module load).
  const { connectDB, disconnectDB } = await import('../src/config/db');
  const { createApp } = await import('../src/app');

  await connectDB();
  const app = createApp();
  const server = app.listen(4100);
  const base = 'http://localhost:4100/api/v1';

  try {
    // 1. Register
    const regRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'secret123',
      }),
    });
    const reg = await regRes.json();
    const cookie1 = cookieFrom(regRes);
    check('register → 201', regRes.status === 201, `got ${regRes.status}`);
    check('register returns accessToken', !!reg.data?.accessToken);
    check('register sets refresh cookie', !!cookie1);
    check(
      'register does NOT leak password',
      reg.data?.user && !('password' in reg.data.user),
    );
    const accessToken: string = reg.data.accessToken;

    // 2. /me with access token
    const meRes = await fetch(`${base}/auth/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json();
    check('me → 200', meRes.status === 200, `got ${meRes.status}`);
    check('me returns correct user', me.data?.user?.email === 'ada@example.com');

    // 2b. /me without token → 401
    const meNoAuth = await fetch(`${base}/auth/me`);
    check('me without token → 401', meNoAuth.status === 401, `got ${meNoAuth.status}`);

    // 3. Refresh (rotation)
    const refreshRes = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookie1! },
    });
    const refreshed = await refreshRes.json();
    const cookie2 = cookieFrom(refreshRes);
    check('refresh → 200', refreshRes.status === 200, `got ${refreshRes.status}`);
    check('refresh issues new access token', !!refreshed.data?.accessToken);
    check('refresh rotates cookie', !!cookie2 && cookie2 !== cookie1);

    // 4. Reuse the OLD refresh cookie → 401 (reuse detection)
    const reuseRes = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookie1! },
    });
    check('reused old refresh token → 401', reuseRes.status === 401, `got ${reuseRes.status}`);

    // 5. Login wrong password → 401
    const badLogin = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'wrong' }),
    });
    check('login wrong password → 401', badLogin.status === 401, `got ${badLogin.status}`);

    // 6. Login correct → 200
    const goodLogin = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'secret123' }),
    });
    const loginCookie = cookieFrom(goodLogin);
    check('login correct → 200', goodLogin.status === 200, `got ${goodLogin.status}`);

    // 7. Logout → 204
    const logoutRes = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: { cookie: loginCookie! },
    });
    check('logout → 204', logoutRes.status === 204, `got ${logoutRes.status}`);

    // 8. Refresh with the revoked cookie → 401
    const afterLogout = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: loginCookie! },
    });
    check('refresh after logout → 401', afterLogout.status === 401, `got ${afterLogout.status}`);

    // 9. Duplicate email → 409
    const dupRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Two',
        email: 'ada@example.com',
        password: 'secret123',
      }),
    });
    check('duplicate email → 409', dupRes.status === 409, `got ${dupRes.status}`);

    // 10. Validation error → 400
    const invalidRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', email: 'nope', password: '123' }),
    });
    check('invalid payload → 400', invalidRes.status === 400, `got ${invalidRes.status}`);
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
