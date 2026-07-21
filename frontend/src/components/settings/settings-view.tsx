"use client";

import { useSearchParams } from "next/navigation";
import { Palette, Bell, UserRound, CreditCard } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { BillingSettings } from "@/components/settings/billing-settings";

const tabs = [
  { value: "theme", label: "Theme", icon: Palette },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "account", label: "Account", icon: UserRound },
  { value: "billing", label: "Billing", icon: CreditCard },
] as const;

export function SettingsView({ predictionsUsed }: { predictionsUsed: number }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const defaultTab = tabs.some((t) => t.value === requestedTab) ? requestedTab! : "theme";

  return (
    <Tabs defaultValue={defaultTab} orientation="vertical" className="flex-row gap-8">
      <TabsList
        variant="line"
        className="h-fit w-48 shrink-0 flex-col items-stretch bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="justify-start gap-2 px-3 py-2 data-active:bg-muted"
          >
            <tab.icon className="size-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="min-w-0 flex-1">
        <TabsContent value="theme">
          <ThemeSettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="billing">
          <BillingSettings predictionsUsed={predictionsUsed} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
