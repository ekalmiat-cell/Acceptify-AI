"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Planned email notifications. Nothing sends these yet, so the switches are
 * shown off and disabled rather than pretending to save a preference.
 */
const plannedNotifications = [
  {
    id: "new-matches",
    label: "New university matches",
    description: "Get notified when a new Safe or Target match appears.",
  },
  {
    id: "deadlines",
    label: "Deadline reminders",
    description: "Reminders 30, 14, and 3 days before application deadlines.",
  },
  {
    id: "score-changes",
    label: "Match score changes",
    description: "Get notified when your predicted match score shifts.",
  },
  {
    id: "product-updates",
    label: "Product updates",
    description: "Occasional emails about new features and universities added.",
  },
];

export function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Email notifications are not available during the beta yet. We
              only email you for sign-in and password reset.
            </CardDescription>
          </div>
          <Badge variant="secondary">Coming soon</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {plannedNotifications.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 py-4 opacity-60 first:pt-0 last:pb-0"
          >
            <div>
              <Label htmlFor={item.id} className="text-sm font-medium text-foreground">
                {item.label}
              </Label>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch id={item.id} checked={false} disabled />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
