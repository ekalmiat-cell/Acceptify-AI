import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAdminUser } from "@/lib/admin";
import { getSession } from "@/lib/session";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FloatingCopilot } from "@/components/dashboard/copilot/floating-copilot";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in?redirect=/dashboard");
  }

  return (
    <SidebarProvider>
      <AppSidebar isAdmin={isAdminUser(session.user)} />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <FloatingCopilot />
    </SidebarProvider>
  );
}
