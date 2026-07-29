# Deploying Acceptify AI

Three pieces, three hosts. The frontend cannot run without the database
(Better Auth lives inside Next.js and talks to Postgres directly), so set them
up in this order.

| Piece | Host | Why not Vercel |
|---|---|---|
| Next.js frontend | **Vercel** | — |
| FastAPI backend | **Railway** (Dockerfile + `railway.json` included) | Vercel functions don't fit a long-lived ASGI app with Alembic migrations |
| Postgres | **Neon** free tier | Vercel doesn't host databases |

Both the frontend and the backend connect to the **same** Neon database.

---

## 1. Postgres (Neon)

1. Create a project at <https://neon.tech>.
2. Copy the connection string. It looks like:
   `postgresql://user:pw@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

You do **not** need to hand-edit it. `backend/app/core/database.py` normalises
libpq-style URLs for asyncpg automatically (scheme, `sslmode`,
`channel_binding`) — see `build_engine_args`.

## 2. Backend (Railway)

1. New project → Deploy from GitHub → `ekalmiat-cell/Acceptify-AI`.
2. Set **Root Directory** to `backend`. Railway picks up `railway.json`, which
   builds the Dockerfile and runs `alembic upgrade head` before starting
   uvicorn, with a health check on `/health`.
3. Variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Neon string from step 1 |
   | `AUTH_ISSUER` | `https://<your-vercel-domain>` |
   | `AUTH_AUDIENCE` | `https://<your-railway-domain>` |
   | `CORS_ORIGINS` | `https://<your-vercel-domain>` |
   | `ENVIRONMENT` | `production` (hides `/docs`) |

4. After the first successful deploy, load the university catalog once —
   without it the app has nothing to show:

   ```
   railway run python -m scripts.seed_universities
   ```

   The seeder is idempotent (upserts by id), so re-running is safe.

## 3. Frontend (Vercel)

The repo is already linked to the Vercel project `ars15/acceptify-ai`
(`frontend/.vercel`). Root directory is `frontend`.

Variables (Production scope):

| Variable | Value |
|---|---|
| `DATABASE_URL` | the same Neon string |
| `BETTER_AUTH_SECRET` | 32+ random chars — `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://<your-vercel-domain>` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>` |
| `NEXT_PUBLIC_API_URL` | `https://<your-railway-domain>` |

All five are **required at build time** — `src/lib/env.server.ts` validates
them when the module is imported, so a missing one fails the build rather than
breaking silently at runtime.

Optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` to switch on the Google
button, `RESEND_API_KEY` / `EMAIL_FROM` to actually deliver password-reset
emails. Without them the buttons explain themselves and reset links are only
logged server-side.

Then:

```
vercel --prod
```

## 4. The chicken-and-egg bit

`AUTH_ISSUER`/`CORS_ORIGINS` on Railway need the Vercel domain, and
`NEXT_PUBLIC_API_URL` on Vercel needs the Railway domain. Deploy the backend
first with placeholder values, deploy the frontend to learn its domain, then
go back and fix the two Railway variables and redeploy it.

## 5. Verify

- `https://<railway>/health` → `{"status":"ok"}`
- `https://<railway>/api/v1/universities` → catalog JSON, not `[]`
- `https://<vercel>/sign-up` → create an account, land on the dashboard
- Save a GPA in the profile → reload → the value is still there

## Google OAuth redirect URI

If you enable Google, add the production callback in Google Cloud Console
alongside the localhost one:

```
https://<your-vercel-domain>/api/auth/callback/google
```
