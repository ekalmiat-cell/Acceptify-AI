import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { isAdminUser } from "@/lib/admin";
import { getSession } from "@/lib/session";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({ en: { settings: "Settings" }, ru: { settings: "Настройки" } });

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

  // The admin area lives under Settings; this is the way back.
  const t = copy[await getLocale()];
  return (
    <>
      <Link
        href="/dashboard/settings"
        className="-mb-2 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t.settings}
      </Link>
      {children}
    </>
  );
}
