# Acceptify AI — frontend

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui.

See the [repo root README](../README.md) for the full architecture, environment setup, and
how auth is wired between this app and the FastAPI backend.

## Scripts

```bash
npm run dev         # start the dev server on :3000
npm run build        # production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
```

Requires `.env.local` (copy from `.env.example`) with a reachable `DATABASE_URL` for
Better Auth's Postgres tables.
