import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

/**
 * Gates every `/dashboard/admin/*` route on the ADMIN_EMAILS allow-list.
 *
 * `notFound()` rather than a redirect or an "access denied" screen: a student
 * who guesses the URL learns nothing about whether an admin area exists. The
 * real enforcement lives on the backend — this only keeps the UI from being
 * reachable (see backend/app/core/security.py::get_current_admin_id).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!isAdminEmail(session?.user?.email)) {
    notFound();
  }

  return <>{children}</>;
}
