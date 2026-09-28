"use client";

import { useSearchParams } from "next/navigation";
import { Palette, Bell, UserRound, CreditCard } from "lucide-react";

import { LanguageSettings } from "@/components/settings/language-settings";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { BillingSettings } from "@/components/settings/billing-settings";

const tabs = [
  { value: "theme", icon: Palette },
  { value: "notifications", icon: Bell },
  { value: "account", icon: UserRound },
  { value: "billing", icon: CreditCard },
] as const;

const copy = defineCopy({
  en: { theme: "Language and theme", notifications: "Notifications", account: "Account", billing: "Billing" },
  ru: { theme: "Язык и тема", notifications: "Уведомления", account: "Аккаунт", billing: "Тариф" },
});

export function SettingsView({ predictionsUsed }: { predictionsUsed: number }) {
  const t = useCopy(copy);
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
            {t[tab.value]}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="min-w-0 flex-1">
        <TabsContent value="theme" className="flex flex-col gap-4">
          <LanguageSettings />
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
