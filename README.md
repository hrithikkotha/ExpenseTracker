# Expense Tracker

Production-ready MERN expense tracker with TypeScript, JWT authentication with rotating refresh tokens, dark mode, and admin RBAC.

## Architecture

**Stack**: MongoDB + Mongoose, Express 4, React 18 + Vite, Node.js 20+, TypeScript on both client and server

**Auth**: JWT access tokens (15min, in-memory client-side) + rotating refresh tokens (7 days, SHA-256 hashed server-side, HTTP-only cookie with `SameSite=Strict`)

**Data model**:
- Unified `Transaction` model (single collection with `type: income|expense` discriminator)
- `Category` (system defaults + user-defined, with type matching enforcement)
- `Budget` (per category or overall, computed `spent` via transaction aggregation)
- `User` with role/isActive fields (admin can view general account info only, NO financial data)

**Client state**: TanStack Query v5 with optimistic updates, React Hook Form + Zod for forms

**Security**: bcrypt, refresh token rotation with reuse detection, Helmet, CORS, rate limiting (100 req/15min), Zod validation, NoSQL injection sanitization

## Features

- **Auth**: Register, login, logout with silent refresh on reload; refresh token rotation with reuse detection (if replayed, revoke entire family)
- **Transactions**: CRUD with type-category validation, search/filter/sort/pagination
- **Categories**: System defaults (16 built-in) + user-defined CRUD; blocks delete when in use
- **Budgets**: Track spending against limits (monthly/yearly, per category or overall), progress bars turn red on overspend
- **Dashboard**: KPI cards (income/expense/balance/savings rate), income vs expense trend chart (AreaChart with gradients), expense by category pie chart, recent 5 transactions
- **Profile & Settings**: Update name/currency/theme, password change
- **Dark mode**: Tailwind class strategy with system preference sync
- **Admin RBAC**: Admins can list users (name/email/role/isActive/join/last-login), toggle account status; **ZERO access to financial data** (transactions/budgets/categories/amounts) per security constraint

## Environment Variables

### Server (`server/.env`)

| Variable              | Required | Default                                | Description                                                                 |
|-----------------------|----------|----------------------------------------|-----------------------------------------------------------------------------|
| `NODE_ENV`            | No       | `development`                          | `development`, `test`, or `production`                                      |
| `PORT`                | No       | `4000`                                 | Server port                                                                 |
| `CLIENT_URL`          | No       | `http://localhost:5173`                | CORS origin                                                                 |
| `MONGODB_URI`         | No       | `mongodb://127.0.0.1:27017/expense_tracker` | MongoDB connection string                                            |
| `ACCESS_TOKEN_SECRET` | **Yes*** | (dev fallback)                         | JWT signing secret (must be strong in production)                           |
| `ACCESS_TOKEN_TTL`    | No       | `15m`                                  | Access token lifetime                                                       |
| `REFRESH_TOKEN_TTL_DAYS` | No    | `7`                                    | Refresh token lifetime in days                                              |
| `BCRYPT_ROUNDS`       | No       | `12`                                   | Bcrypt cost factor (10-15)                                                  |
| `REFRESH_COOKIE_NAME` | No       | `et_rt`                                | Refresh token cookie name                                                   |
| `ADMIN_EMAIL`         | No       | -                                      | Admin user email (seed script)                                              |
| `ADMIN_PASSWORD`      | No       | -                                      | Admin user password (seed script)                                           |

\* Required in production; dev has a fallback (not secure, only for local use).

### Client (`client/.env`)

| Variable          | Required | Default                      | Description      |
|-------------------|----------|------------------------------|------------------|
| `VITE_API_URL`    | No       | `http://localhost:4000/api/v1` | API base URL    |

## Local Development

```bash
# Install dependencies
npm install          # Root (concurrently script)
cd server && npm install
cd ../client && npm install

# Seed database (categories + admin if ADMIN_EMAIL/ADMIN_PASSWORD set)
cd server && npm run seed

# Start both server + client
npm run dev          # From root

# Or start separately
cd server && npm run dev
cd client && npm run dev
```

**Build**:
```bash
cd server && npm run build   # → server/dist
cd client && npm run build   # → client/dist
```

**Lint/Typecheck**:
```bash
cd server && npm run typecheck
cd client && npm run build   # vite build includes tsc --noEmit
```

## Deployment

### Client (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Build settings:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_URL`: `https://your-api.onrender.com/api/v1`
5. Deploy

### Server (Render)

1. Create Web Service linked to GitHub repo
2. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
   - **Environment**: Node 20+
3. Environment Variables: (see table above; set `ACCESS_TOKEN_SECRET`, `MONGODB_URI`, `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`)
4. Auto-deploy on push to main

**Seed on Render**: After first deploy, run seed via Render Shell:
```bash
npm run seed
```

### Database (MongoDB Atlas)

1. Create cluster (M0 free tier)
2. Add DB user
3. Whitelist Render IPs (or `0.0.0.0/0` for simplicity)
4. Copy connection string → `MONGODB_URI` in Render env vars

## CI/CD Notes

- **GitHub Actions**: Add workflows for `npm run typecheck` + `npm run build` on pull requests
- **Vercel**: Auto-deploys on main branch push
- **Render**: Auto-deploys on main branch push

## Admin Setup

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in server env vars, then run `npm run seed`. The seed script is idempotent: if the user exists, it upgrades their role to admin; if not, it creates them. **Role changes are seed-only** (no runtime endpoint to promote users).

## Security Constraint

Admin role can ONLY see general account information (name, email, role, isActive, createdAt, lastLoginAt). Admin has **ZERO access** to any private financial data: transactions, budgets, categories, or amounts. Violating this constraint is prohibited.

## License

MIT
