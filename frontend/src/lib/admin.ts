import "server-only";
import { env } from "@/lib/env.server";

/**
 * Whether an address belongs to a platform administrator.
 *
 * The app has no role table: admin is an allow-list of email addresses, kept
 * in `ADMIN_EMAILS` on both this app and the FastAPI backend. This side only
 * decides whether to *show* the admin UI — the backend independently rejects
 * writes from anyone not on its own list (see
 * backend/app/core/security.py::get_current_admin_id), so a stale or missing
 * value here can never grant access it shouldn't.
 *
 * An unset/empty list means nobody is an admin, which is the safe default:
 * the program catalog stays read-only until someone is deliberately named.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowed = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.trim().toLowerCase());
}
