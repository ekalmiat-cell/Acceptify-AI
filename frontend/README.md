# Acceptify AI — app

The whole application: pages, API routes and database migrations. See the
[repository README](../README.md) for the architecture and
[DEPLOYMENT.md](../DEPLOYMENT.md) for deploying to Vercel.

```bash
npm run dev          # development server on :3000
npm run db:migrate   # apply migrations + seed the university catalog
npm run build        # migrate, then production build
npm test             # unit tests
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

Requires `.env.local` (copy from `.env.example`) with a reachable `DATABASE_URL`.
