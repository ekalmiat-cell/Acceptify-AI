import type { Metadata } from "next";
import { Suspense } from "react";

import { SettingsView } from "@/components/settings/settings-view";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import { getPredictionHistory } from "@/lib/predictions-server";

const copy = defineCopy({
  en: { title: "Settings", subtitle: "Manage your language, appearance, notifications, account, and billing." },
  ru: { title: "Настройки", subtitle: "Язык, оформление, уведомления, аккаунт и тариф." },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].title };
}

export default async function SettingsPage() {
  const t = copy[await getLocale()];
  const predictionHistory = await getPredictionHistory();
  const now = new Date();
  const predictionsThisMonth = predictionHistory.filter((p) => {
    const createdAt = new Date(p.createdAt);
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <Suspense>
        <SettingsView predictionsUsed={predictionsThisMonth} />
      </Suspense>
    </div>
  );
}
