import { NextResponse } from "next/server";

import { readDevLink } from "@/lib/email";

/**
 * Development-only escape hatch: with no mail provider configured there is no
 * inbox to open, so the forgot-password page reads the freshly minted reset
 * link from here. Handing out reset links over an unauthenticated endpoint
 * would be an account takeover in production, so the route does not exist
 * there — it 404s before touching anything.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  return NextResponse.json({ url: readDevLink(email) });
}
