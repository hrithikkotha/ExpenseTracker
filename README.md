# Expense Tracker (MERN + TypeScript)

A production-ready personal finance app: track income & expenses, categorize, budget, and analyze — with JWT auth (access token in memory + rotating refresh token in an HTTP-only cookie), an admin role for account management, and a clean layered architecture.

> **Status:** Phase 0 — Scaffold & Tooling. Feature phases follow (see roadmap).

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + React Router + TanStack Query + Axios |
| Backend | Node.js + Express 4 + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + rotating refresh), HTTP-only cookies, bcrypt |
| Validation | Zod (shared mental model across client & server) |

## Repository Layout

```
expense-tracker/
├── client/   # React + Vite + TS SPA
├── server/   # Express + TS API
└── package.json  # root dev orchestration (concurrently)
```

## Getting Started

### Prerequisites
- Node.js >= 18.18
- A MongoDB connection string (MongoDB Atlas free tier or local `mongod`)

### 1. Install everything
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# then edit server/.env with your MONGODB_URI
```

### 3. Run both apps (from the repo root)
```bash
npm run dev
```
- Client: http://localhost:5173
- API health check: http://localhost:4000/api/v1/health

## Available Scripts (root)

| Script | Description |
|---|---|
| `npm run dev` | Run server + client together |
| `npm run build` | Build both for production |
| `npm run lint` | Lint both packages |
| `npm run install:all` | Install root + server + client deps |

## Roadmap

- **Phase 0** — Scaffold & tooling ✅ (this phase)
- **Phase 1** — Authentication (register/login/logout/refresh, protected routes)
- **Phase 2** — Categories
- **Phase 3** — Transactions CRUD
- **Phase 4** — Search / filter / sort / paginate
- **Phase 5** — Dashboard & analytics
- **Phase 6** — Budgets
- **Phase 7** — Profile, settings & dark mode
- **Phase 8** — Admin & RBAC (account status control, general-info only)
- **Phase 9** — Hardening & deployment (Vercel + Render + Atlas)

## License
MIT
