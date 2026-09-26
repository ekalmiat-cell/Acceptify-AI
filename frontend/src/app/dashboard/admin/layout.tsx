import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isAdminUser } from "@/lib/admin";
import { getSession } from "@/lib/session";

/**
 * Gates every `/dashboard/admin/*` route on the ADMIN_EMAILS allow-list.
 *
 * `notFound()` rather than a redirect or an "access denied" screen: a student
 * who guesses the URL learns nothing about whether an admin area exists. The
 * API routes enforce the same rule on every write (see `requireAdmin` in
 * lib/route.ts) — this only keeps the UI from being reachable.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!isAdminUser(session?.user)) {
    notFound();
  }

  return <>{children}</>;
}
