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
  ShieldCheck,
  Layers,
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { authClient, useSession } from "@/lib/auth-client";

const studentNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Universities", href: "/dashboard/universities", icon: Building2 },
  { label: "Analysis", href: "/dashboard/analysis", icon: ChartNoAxesCombined },
  { label: "AI Essay Reviewer", href: "/dashboard/essays", icon: Sparkles },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Layers },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
  { label: "Methodology", href: "/dashboard/methodology", icon: FlaskConical },
];

const adminNavItem = { label: "Admin", href: "/dashboard/admin", icon: ShieldCheck };

const settingsNavItem = { label: "Settings", href: "/dashboard/settings", icon: Settings };

/**
 * `isAdmin` is resolved on the server (the ADMIN_EMAILS allow-list is not
 * exposed to the browser) and passed down — see app/dashboard/layout.tsx.
 * Hiding the link is a convenience only; the route and the API behind it are
 * both independently gated.
 */
export function AppSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const items = [
    ...studentNavItems,
    ...(isAdmin ? [adminNavItem] : []),
    settingsNavItem,
  ];

  const user = session?.user;
  const initials = getInitials(user?.name ?? user?.email ?? "AA");

  async function handleSignOut() {
    await authClient.signOut();
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
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
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
            className="bg-gradient-brand flex flex-col gap-1 rounded-xl p-3 text-white shadow-glow-brand transition-opacity hover:opacity-90"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="size-3.5" />
              Upgrade to Pro
            </span>
            <span className="text-[0.7rem] text-white/80">
              Unlimited predictions & scholarship matching
            </span>
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
                {user?.name ?? "Your account"}
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
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {user?.name ?? "Your account"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard/settings?tab=billing" />}>
              <CreditCard />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut />
              Sign out
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
