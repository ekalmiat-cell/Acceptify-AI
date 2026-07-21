import type { Metadata } from "next";
import { Suspense } from "react";

import { SettingsView } from "@/components/settings/settings-view";
import { getPredictionHistory } from "@/lib/predictions-server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const predictionHistory = await getPredictionHistory();
  const now = new Date();
  const predictionsThisMonth = predictionHistory.filter((p) => {
    const createdAt = new Date(p.createdAt);
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your appearance, notifications, account, and billing.
        </p>
      </div>

      <Suspense>
        <SettingsView predictionsUsed={predictionsThisMonth} />
      </Suspense>
    </div>
  );
}
