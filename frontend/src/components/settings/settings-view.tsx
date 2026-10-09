"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Palette, Bell, UserRound, CreditCard, Smartphone, ShieldCheck } from "lucide-react";

import { LanguageSettings } from "@/components/settings/language-settings";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { AccountSettings } from "@/components/settings/account-settings";
import { BillingSettings } from "@/components/settings/billing-settings";
import { InstallAppSettings } from "@/components/settings/install-app-settings";

const tabs = [
  { value: "theme", icon: Palette },
  { value: "notifications", icon: Bell },
  { value: "account", icon: UserRound },
  { value: "billing", icon: CreditCard },
  { value: "app", icon: Smartphone },
] as const;

const copy = defineCopy({
  en: {
    theme: "Language and theme",
    notifications: "Notifications",
    account: "Account",
    billing: "Billing",
    app: "App",
    admin: "Admin",
  },
  ru: {
    theme: "Язык и тема",
    notifications: "Уведомления",
    account: "Аккаунт",
    billing: "Тариф",
    app: "Приложение",
    admin: "Админка",
  },
});

/**
 * `isAdmin` comes from the server (the allow-list never reaches the browser).
 * The admin link is a convenience; the admin pages and their API are gated
 * on their own.
 */
export function SettingsView({ predictionsUsed, isAdmin = false }: { predictionsUsed: number; isAdmin?: boolean }) {
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
        {isAdmin ? (
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ShieldCheck className="size-4" />
            {t.admin}
          </Link>
        ) : null}
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
        <TabsContent value="app">
          <InstallAppSettings />
        </TabsContent>
      </div>
    </Tabs>
  );
}
