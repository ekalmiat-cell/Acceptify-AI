import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  // 1. Try Better Auth cookie-based session
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Ignore and try Bearer token
  }

  // 2. Try Bearer token in Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        const candidate = payload.id || payload.sub;
        if (typeof candidate === "string" && candidate.length > 0) {
          return candidate;
        }
      }
    } catch {
      // Malformed token
    }
  }

  return null;
}
