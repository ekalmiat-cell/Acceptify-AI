"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  UserRound,
  Settings,
  Sparkles,
  LogOut,
  ChevronsUpDown,
  CreditCard,
  ChartNoAxesCombined,
  FlaskConical,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { authClient, useSession } from "@/lib/auth-client";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { forgetArsIntro } from "@/components/dashboard/copilot/floating-copilot";
import { ACCOUNT_PATHS, STUDIO_PATHS } from "@/components/dashboard/page-tabs";

/**
 * `paths`: every page an item stands for. Several sections share one item and
 * switch with tabs at the top: the essay studio (review, training,
 * interview), the profile (with the portfolio), and the settings (with the
 * admin area, which only admins can open — see app/dashboard/admin/layout.tsx).
 */
const navItems = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "universities", href: "/dashboard/universities", icon: Building2 },
  { key: "analysis", href: "/dashboard/analysis", icon: ChartNoAxesCombined },
  { key: "essays", href: "/dashboard/essays", icon: Sparkles, paths: STUDIO_PATHS },
  { key: "profile", href: "/dashboard/profile", icon: UserRound, paths: ACCOUNT_PATHS },
  { key: "methodology", href: "/dashboard/methodology", icon: FlaskConical },
  { key: "settings", href: "/dashboard/settings", icon: Settings, paths: ["/dashboard/settings", "/dashboard/admin"] },
] as const;

const copy = defineCopy({
  en: {
    nav: {
      overview: "Overview",
      universities: "Universities",
      analysis: "Analysis",
      essays: "Essay Studio",
      profile: "Profile",
      methodology: "Methodology",
      settings: "Settings",
    },
    platform: "Platform",
    beta: "Free beta",
    betaNote: "Every feature is unlocked while we're in beta",
    yourAccount: "Your account",
    billing: "Billing",
    signOut: "Sign out",
  },
  ru: {
    nav: {
      overview: "Обзор",
      universities: "Университеты",
      analysis: "Анализ",
      essays: "Эссе-студия",
      profile: "Профиль",
      methodology: "Методология",
      settings: "Настройки",
    },
    platform: "Платформа",
    beta: "Бесплатная бета",
    betaNote: "Пока идёт бета, открыты все функции",
    yourAccount: "Твой аккаунт",
    billing: "Тариф",
    signOut: "Выйти",
  },
});

export function AppSidebar() {
  const t = useCopy(copy);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;
  const initials = getInitials(user?.name ?? user?.email ?? "AA");

  async function handleSignOut() {
    await authClient.signOut();
    forgetArsIntro();
    router.push("/");
    router.refresh();
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center px-2 py-1.5">
          <Logo />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10.5px] tracking-[0.16em] uppercase">{t.platform}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const paths: readonly string[] = "paths" in item ? item.paths : [item.href];
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : paths.some((path) => pathname?.startsWith(path));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      // The current page is the one filled in ink.
                      className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                      tooltip={t.nav[item.key]}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{t.nav[item.key]}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="group-data-[collapsible=icon]:hidden">
          <Link
            href="/pricing"
            className="flex flex-col gap-1 rounded-xl border bg-background p-3 transition-colors hover:border-foreground/25"
          >
            <span className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-foreground uppercase">
              <span className="size-1.5 rounded-full bg-[#e5484d]" />
              {t.beta}
            </span>
            <span className="text-[0.7rem] text-muted-foreground">{t.betaNote}</span>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar size="sm" className="rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {user?.name ?? t.yourAccount}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email ?? ""}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="w-(--anchor-width) min-w-56"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {user?.name ?? t.yourAccount}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ?? ""}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <Settings />
              {t.nav.settings}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard/settings?tab=billing" />}>
              <CreditCard />
              {t.billing}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut />
              {t.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function getInitials(value: string) {
  const parts = value.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "AA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
