# Acceptify AI

An AI-powered university admissions platform: a student fills in their academic
profile and achievements, and gets an explainable fit score and admission estimate
for 239 universities, a what-if simulator, an AI essay reviewer and an AI admissions
copilot.

One Next.js app, one Postgres database, deployed on Vercel. Everything runs on free
tiers (Vercel Hobby, Neon, Gemini API, Resend) — see [DEPLOYMENT.md](DEPLOYMENT.md).

## Tech stack

| Layer          | Choice                                                             |
| -------------- | ------------------------------------------------------------------ |
| App            | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4   |
| UI             | shadcn/ui (Base UI primitives) · Framer Motion · Lucide React      |
| API            | Next.js route handlers under `src/app/api/v1/*`                    |
| Database       | PostgreSQL (Neon in production) via `pg`, plain SQL migrations     |
| Authentication | Better Auth — email/password, Google, Apple                        |
| AI             | Google Gemini REST API (free tier), per-user hourly limits         |
| Email          | Resend (password reset, email confirmation)                        |
| Deployment     | Vercel                                                             |

## Folder structure

```
acceptify-ai/
├── frontend/                        the whole app — Vercel root directory
│   ├── db/migrations/               numbered .sql files, applied in order
│   ├── scripts/migrate.mjs          applies migrations + seeds the university catalog
│   └── src/
│       ├── app/
│       │   ├── (marketing)/         landing + pricing
│       │   ├── (auth)/              sign-in, sign-up, password reset
│       │   ├── dashboard/           the product (server components)
│       │   └── api/
│       │       ├── auth/[...all]/   Better Auth
│       │       └── v1/              JSON API for client components
│       ├── lib/
│       │   ├── data/                all database access (one module per table group)
│       │   ├── ai/                  Gemini client, essay review, copilot, prompt context
│       │   ├── route.ts             route-handler wrapper, auth guards, error shape
│       │   ├── validation.ts        request-body schemas (zod)
│       │   ├── session.ts           current session for server components
│       │   ├── auth.ts              Better Auth configuration
│       │   ├── predict.ts …         scoring engine (pure functions, unit-tested)
│       │   └── *-server.ts / *-client.ts   loaders for pages / fetchers for components
│       └── data/                    static catalogs (achievements, FAQ, university seed)
├── docker-compose.yml               optional local Postgres
└── package.json                     convenience scripts that forward to frontend/
```

### How a request flows

- **Pages** are server components. They read the session from the cookie
  (`lib/session.ts`) and query Postgres directly through `lib/data/*` — no HTTP
  round trip to themselves.
- **Client components** that change data call `/api/v1/*` on the same origin via
  `lib/api-client.ts`. The browser sends the Better Auth session cookie; each route
  identifies the user with `requireUser()` / `requireAdmin()` from `lib/route.ts`.
  User ids never come from the request body or a client-supplied token.
- **Admin** is an allow-list: `ADMIN_EMAILS`, and the account's email must be
  verified.

## Getting started

Prerequisites: Node.js 20.12+ and a Postgres database (Docker, a local install, or a
free Neon database).

```powershell
npm run setup                    # installs dependencies, creates frontend/.env.local
docker compose up -d             # optional: local Postgres matching .env.example
npm run db:migrate               # creates all tables and loads the 239 universities
npm run dev                      # http://localhost:3000
```

Fill in `frontend/.env.local` — every variable is documented in
[`frontend/.env.example`](frontend/.env.example). Without `GEMINI_API_KEY` the AI
features say they are not configured; set `AI_PROVIDER=mock` to get placeholder
answers while developing offline.

## Scripts (run inside `frontend/`)

| Command              | What it does                                              |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | development server                                        |
| `npm run build`      | applies migrations, then builds for production            |
| `npm run db:migrate` | applies pending migrations and seeds missing universities |
| `npm test`           | unit tests (Vitest)                                       |
| `npm run typecheck`  | TypeScript                                                |
| `npm run lint`       | ESLint                                                    |

## Database migrations

Schema changes are new files in `frontend/db/migrations/` named `NNNN_description.sql`.
`scripts/migrate.mjs` records applied files in `schema_migrations` and runs each new one
in a transaction; it also runs as the first step of every build, so a Vercel deploy
brings its database up to date before the new code goes live. Write migrations to be
safe to re-run (`IF NOT EXISTS`) — the first one had to adopt databases created by the
retired FastAPI backend.

## What the scores mean

The fit score is a deterministic, explainable comparison of a profile with a
programme's weighted criteria (`lib/predict.ts`). The admission probability
(`lib/probability.ts`) starts from each university's acceptance rate and is **not
calibrated yet**: that needs real outcomes, which students can report from their
portfolio. The methodology page shows how many have been collected; the model is only
called calibrated after 100.
