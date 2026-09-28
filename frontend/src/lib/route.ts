import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminUser } from "@/lib/admin";
import { HttpError } from "@/lib/http-error";
import { getLocale } from "@/lib/i18n/server";
import { localizeIssue, localizeMessage } from "@/lib/i18n/server-messages";
import { getSession } from "@/lib/session";

/**
 * Shared plumbing for the `/api/v1/*` route handlers.
 *
 * Every handler answers errors in one shape — `{ detail }`, where `detail` is
 * a sentence, or for validation failures a list of `{ loc, msg }` — which is
 * what `lib/api-request.ts` already knows how to turn into a readable toast.
 */

export { HttpError };

type Handler<Ctx> = (request: Request, context: Ctx) => Promise<Response>;

/**
 * Wraps a route handler so that thrown `HttpError`s become their status code,
 * validation failures become 422s, and anything unexpected becomes a logged
 * 500 whose message does not leak internals to the browser.
 */
export function route<Ctx = unknown>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Errors are written in English and translated here, on the way out.
      const locale = await getLocale().catch(() => "en" as const);

      if (error instanceof HttpError) {
        return NextResponse.json({ detail: localizeMessage(error.message, locale) }, { status: error.status });
      }

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            detail: error.issues.map((issue) => ({
              loc: issue.path.map(String),
              msg: localizeIssue(issue, locale),
            })),
          },
          { status: 422 },
        );
      }

      console.error(`[api] ${request.method} ${new URL(request.url).pathname} failed`, error);
      return NextResponse.json(
        { detail: localizeMessage("Something went wrong on our side. Please try again.", locale) },
        { status: 500 },
      );
    }
  };
}

export interface CurrentUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

/** The signed-in user, or a 401. Identity comes only from the session cookie. */
export async function requireUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) {
    throw new HttpError(401, "Your session expired. Sign in again.");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
  };
}

/** The signed-in user if they are on the admin allow-list, or a 401/403. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isAdminUser(user)) {
    throw new HttpError(403, "This action is restricted to platform administrators.");
  }
  return user;
}

/** Parses and validates a JSON request body. */
export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "The request body must be valid JSON.");
  }
  return schema.parse(body);
}

/** A 404 for a path id that is not a UUID, before it ever reaches Postgres. */
export function parseUuid(value: string, notFoundMessage: string): string {
  if (!z.uuid().safeParse(value).success) {
    throw new HttpError(404, notFoundMessage);
  }
  return value;
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}
