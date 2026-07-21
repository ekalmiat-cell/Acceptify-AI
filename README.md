# Acceptify AI

An AI-powered university admissions platform. This repository currently contains the
**production foundation only** — no landing page, dashboard, or assessment features yet.
Everything here exists so real feature work can start immediately on solid ground.

## Tech stack

| Layer          | Choice                                                            |
| -------------- | ------------------------------------------------------------------ |
| Frontend       | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 |
| UI             | shadcn/ui (Nova preset, Base UI primitives) · Framer Motion · Lucide React |
| Backend        | FastAPI · Python · SQLAlchemy 2.0 (async) · Alembic              |
| Database       | PostgreSQL                                                        |
| Authentication | Better Auth — Email/Password, Google, Apple                      |
| Deployment     | Vercel (frontend) · Railway (backend + Postgres)                 |

## Folder structure

```
acceptify-ai/
├── frontend/                    Next.js app — Vercel deploy root
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/auth/[...all]/route.ts   Better Auth route handler
│   │   │   ├── layout.tsx                   fonts, metadata, providers
│   │   │   ├── page.tsx                     placeholder root page
│   │   │   └── globals.css                  brand theme (Tailwind v4 tokens)
│   │   ├── components/
│   │   │   ├── ui/                          shadcn/ui primitives
│   │   │   ├── shared/                      generic layout primitives (Container, ...)
│   │   │   └── providers/                   ThemeProvider, AppProviders (composition root)
│   │   ├── lib/
│   │   │   ├── auth.ts                      Better Auth server instance
│   │   │   ├── auth-client.ts                Better Auth React client
│   │   │   ├── api-client.ts / api-server.ts fetch wrappers for the FastAPI backend
│   │   │   ├── db.ts                        pg Pool (Better Auth's Postgres adapter)
│   │   │   ├── env.server.ts / env.client.ts validated, boundary-safe env access
│   │   │   └── utils.ts
│   │   ├── hooks/                           generic reusable hooks
│   │   ├── types/                           shared TS types
│   │   ├── config/                          site.ts, app-wide constants
│   │   └── middleware.ts                    session-cookie route protection (no protected routes yet)
│   └── .env.example
│
├── backend/                     FastAPI app — Railway deploy root
│   ├── app/
│   │   ├── main.py                          app factory, CORS, middleware, lifespan
│   │   ├── core/                            config, database, security (JWT verification), logging
│   │   ├── api/
│   │   │   ├── deps.py                      DbSession / CurrentUserId dependency aliases
│   │   │   └── v1/                          versioned router + endpoints (health only so far)
│   │   ├── models/                          SQLAlchemy declarative Base + mixins
│   │   ├── schemas/                         Pydantic request/response schemas
│   │   ├── services/                        business logic, kept out of the HTTP layer
│   │   └── middleware/                      request-id + latency logging
│   ├── alembic/                             async-engine migrations (no domain tables yet)
│   ├── tests/
│   ├── Dockerfile                           Railway build
│   └── .env.example
│
├── scripts/
│   ├── setup.ps1 / setup.sh                 one-time install (frontend deps + backend venv)
│   └── dev.mjs                              runs both dev servers together
│
├── docker-compose.yml                       local Postgres for development
└── package.json                             root convenience scripts (`npm run dev`)
```

## Getting started

**Prerequisites:** Node.js 20+, Python 3.11+, Docker (for local Postgres) — or a remote
Postgres connection string if you'd rather not run Docker.

```powershell
# 1. Install everything (frontend deps + backend venv)
npm run setup          # or: pwsh scripts/setup.ps1 / bash scripts/setup.sh

# 2. Start Postgres locally
docker compose up -d

# 3. Copy env templates and fill in real values
copy frontend\.env.example frontend\.env.local
copy backend\.env.example backend\.env

# 4. Run both dev servers
npm run dev
```

Frontend: http://localhost:3000 · Backend: http://localhost:8000 (docs at `/docs` outside production).

Once `DATABASE_URL` points at a running Postgres:

```powershell
cd frontend; npx @better-auth/cli migrate    # creates Better Auth's user/session/account tables
cd backend; .venv\Scripts\alembic upgrade head  # creates domain tables (none yet — safe no-op)
```

## How authentication works

Better Auth runs entirely inside the Next.js app and owns its own Postgres tables
(`user`, `session`, `account`, `verification`) in the **same** database the backend uses —
the backend never touches those tables directly.

1. Browser ↔ Next.js: normal cookie-based sessions via Better Auth (Email/Password, Google, Apple).
2. Next.js ↔ FastAPI: the frontend mints a short-lived JWT from the active session
   (`GET /api/auth/token`, wrapped by `lib/api-client.ts` / `lib/api-server.ts`) and sends it
   as a Bearer token. FastAPI verifies it against Better Auth's JWKS endpoint
   (`{AUTH_ISSUER}/api/auth/jwks`) — see `backend/app/core/security.py`. No shared secret,
   no duplicated auth logic in Python.

## Design system

Primary color `#0B1F3A`, white background, generous spacing, rounded corners, no gradients —
configured as CSS custom properties in `frontend/src/app/globals.css`. Dark mode is wired up
(via `next-themes`) with a navy-tinted palette, ready for when it's needed.

## What's ready

- Full frontend/backend project structure, typed end-to-end
- Brand theme + a solid shadcn/ui component set (button, input, form, dialog, card, tabs, etc.)
- Better Auth configured for Email/Password + Google + Apple, with the Postgres adapter wired up
- Cross-service JWT auth (frontend issues, backend verifies via JWKS) — no features gated behind it yet
- FastAPI app with versioned API router, async SQLAlchemy + Alembic, structured request logging
- Local Postgres via Docker Compose; Dockerfile for Railway
- Lint, type-check, and test tooling passing on both sides (ESLint/tsc on the frontend; ruff/mypy/pytest on the backend)

## What's next

- Real OAuth credentials (Google Cloud console, Apple Developer) in each `.env`
- Domain models (applications, universities, essays, ...) + first Alembic migration
- Protected routes: add prefixes to `frontend/src/middleware.ts` as pages land
- The actual product: landing page, dashboard, assessment, university data — intentionally out of scope here

## Known caveats

- This machine has no `git` on PATH, so the repo hasn't been initialized — run `git init` when ready.
- `next build` prints an Edge Runtime warning about `CompressionStream` (pulled in transitively by
  `better-auth/cookies` via `jose`). It's a warning, not an error, and doesn't affect JWT verification.
