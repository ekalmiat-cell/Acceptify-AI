"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, FileText, Layers, MessagesSquare, UserRound, type LucideIcon } from "lucide-react";

import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Sections that share one place in the sidebar, switched by tabs at the top
 * of the page. Each section keeps its own URL.
 */

interface Tab {
  href: string;
  icon: LucideIcon;
  label: string;
}

function PageTabs({ id, label, tabs }: { id: string; label: string; tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="-mb-2 overflow-x-auto [scrollbar-width:none]">
      {/* On a phone the tabs share the width and drop their icons, so the
          last one isn't cut off behind the edge. */}
      <div className="flex w-full gap-1 rounded-full border border-border bg-muted/50 p-1 sm:inline-flex sm:w-auto">
        {tabs.map(({ href, icon: Icon, label: tabLabel }) => {
          const active = Boolean(pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 shrink-0 items-center justify-center gap-2 rounded-full px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-4 sm:text-sm",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-tab`}
                  className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-border"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon className="relative hidden size-4 sm:block" />
              <span className="relative">{tabLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Essay review, training and interview practice: the essay studio. */
export const STUDIO_PATHS = ["/dashboard/essays", "/dashboard/training", "/dashboard/interview"];

/** The student's profile and their application portfolio. */
export const ACCOUNT_PATHS = ["/dashboard/profile", "/dashboard/portfolio"];

const copy = defineCopy({
  en: {
    studio: "Essay studio sections",
    review: "Essay review",
    training: "Training",
    interview: "Interview",
    account: "Profile sections",
    profile: "Profile",
    portfolio: "Portfolio",
  },
  ru: {
    studio: "Разделы эссе-студии",
    review: "Разбор эссе",
    training: "Тренировка",
    interview: "Собеседование",
    account: "Разделы профиля",
    profile: "Профиль",
    portfolio: "Портфолио",
  },
});

export function StudioTabs() {
  const t = useCopy(copy);
  return (
    <PageTabs
      id="studio"
      label={t.studio}
      tabs={[
        { href: STUDIO_PATHS[0], icon: FileText, label: t.review },
        { href: STUDIO_PATHS[1], icon: Dumbbell, label: t.training },
        { href: STUDIO_PATHS[2], icon: MessagesSquare, label: t.interview },
      ]}
    />
  );
}

export function AccountTabs() {
  const t = useCopy(copy);
  return (
    <PageTabs
      id="account"
      label={t.account}
      tabs={[
        { href: ACCOUNT_PATHS[0], icon: UserRound, label: t.profile },
        { href: ACCOUNT_PATHS[1], icon: Layers, label: t.portfolio },
      ]}
    />
  );
}
