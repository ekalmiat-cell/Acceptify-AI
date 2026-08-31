import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const id =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_ID;
  const secret =
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_SECRET;

  return NextResponse.json({
    status: "ok",
    has_google_client_id: Boolean(id),
    google_client_id_preview: id ? `${id.slice(0, 12)}...` : null,
    has_google_client_secret: Boolean(secret),
    has_database_url: Boolean(process.env.DATABASE_URL),
    has_better_auth_secret: Boolean(process.env.BETTER_AUTH_SECRET),
    better_auth_url: process.env.BETTER_AUTH_URL ?? null,
    vercel_env: process.env.VERCEL_ENV ?? "local",
  });
}
