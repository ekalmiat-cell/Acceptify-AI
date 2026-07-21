"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const initialPreferences = [
  {
    id: "new-matches",
    label: "New university matches",
    description: "Get notified when a new Safe or Target match appears.",
    enabled: true,
  },
  {
    id: "deadlines",
    label: "Deadline reminders",
    description: "Reminders 30, 14, and 3 days before application deadlines.",
    enabled: true,
  },
  {
    id: "score-changes",
    label: "Match score changes",
    description: "Get notified when your predicted match score shifts.",
    enabled: false,
  },
  {
    id: "product-updates",
    label: "Product updates",
    description: "Occasional emails about new features and universities added.",
    enabled: false,
  },
];

export function NotificationSettings() {
  const [preferences, setPreferences] = useState(initialPreferences);

  function toggle(id: string) {
    setPreferences((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, enabled: !p.enabled };
        toast.success(`${next.label} ${next.enabled ? "enabled" : "disabled"}`);
        return next;
      })
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what Acceptify AI should email you about.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {preferences.map((pref) => (
          <div key={pref.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <Label htmlFor={pref.id} className="text-sm font-medium text-foreground">
                {pref.label}
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">{pref.description}</p>
            </div>
            <Switch id={pref.id} checked={pref.enabled} onCheckedChange={() => toggle(pref.id)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
