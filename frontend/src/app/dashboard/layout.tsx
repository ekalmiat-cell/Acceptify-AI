import type { ReactNode } from "react";
import { redirect } from "next/navigation";

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
      <AppSidebar />
      {/* Warm paper behind the white cards, like sheets on a desk. */}
      <SidebarInset className="bg-mk-deep">
        <DashboardHeader />
        {/* overflow-x-clip: stickers and stamps that animate in tilted must
            not widen the page on a phone. */}
        <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-x-clip p-4 md:p-6">{children}</div>
      </SidebarInset>
      <FloatingCopilot />
    </SidebarProvider>
  );
}
