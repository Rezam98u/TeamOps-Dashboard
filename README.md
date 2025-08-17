# TeamOps Dashboard

Internal management tool with React + Express + Prisma + PostgreSQL. CI pipeline runs lint, typecheck, unit/integration, e2e, and build.

## CI Status

![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)

## Getting Started

### Backend

1. Set `.env`:
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `FRONTEND_URL=http://localhost:5173`
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/teamops`
2. Install & run
```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm ci
npm run dev
```

### E2E
```bash
cd e2e
npm ci
npx playwright install
npm run test:ci
```

## Deployment

- Frontend (Vercel): set `VITE_BACKEND_URL` to your backend URL.
- Backend (Railway/Render): set `PORT`, `DATABASE_URL`, `JWT_*`, `FRONTEND_URL`.

## Architecture

```mermaid
flowchart LR
  A[React + Vite] -- Axios (Bearer) --> B[Express API]
  B -- Prisma --> C[(PostgreSQL)]
  A -- httpOnly cookie --> B
  subgraph Auth
    A <--> B
  end
```

## Environment Variables

- Backend
  - `PORT` (default 3001)
  - `FRONTEND_URL` (CORS)
  - `DATABASE_URL` (Postgres)
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- Frontend
  - `VITE_BACKEND_URL` (API base URL)
  - `VITE_DEMO_KPI_ID` (optional, for dashboard demo)

## Scripts

At repo root:
```bash
npm run dev        # run frontend + backend
npm run build      # build both
npm run test       # frontend + backend + e2e
npm run lint       # lint frontend + backend
npm run typecheck  # typecheck frontend + backend
```

## Contributing

- Conventional Commits (feat:, fix:, chore:, docs:, test:, refactor:, ci:)
- PRs require green CI and adequate tests (≥90% backend target)

