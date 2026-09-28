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
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

/**
 * Planned email notifications. Nothing sends these yet, so the switches are
 * shown off and disabled rather than pretending to save a preference.
 */
const copy = defineCopy({
  en: {
    title: "Notifications",
    description:
      "Email notifications are not available during the beta yet. We only email you for sign-in and password reset.",
    soon: "Coming soon",
    items: [
      { id: "new-matches", label: "New university matches", description: "Get notified when a new Safe or Target match appears." },
      { id: "deadlines", label: "Deadline reminders", description: "Reminders 30, 14, and 3 days before application deadlines." },
      { id: "score-changes", label: "Match score changes", description: "Get notified when your predicted match score shifts." },
      { id: "product-updates", label: "Product updates", description: "Occasional emails about new features and universities added." },
    ],
  },
  ru: {
    title: "Уведомления",
    description: "Уведомления по почте в бета-версии пока недоступны. Мы пишем только для входа и сброса пароля.",
    soon: "Скоро",
    items: [
      { id: "new-matches", label: "Новые подходящие университеты", description: "Сообщим, когда появится новый вариант уровня Safe или Target." },
      { id: "deadlines", label: "Напоминания о дедлайнах", description: "За 30, 14 и 3 дня до дедлайна подачи." },
      { id: "score-changes", label: "Изменения шансов", description: "Сообщим, когда изменится твой прогноз по университету." },
      { id: "product-updates", label: "Новости Acceptify", description: "Иногда — о новых функциях и добавленных университетах." },
    ],
  },
});

export function NotificationSettings() {
  const t = useCopy(copy);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          <Badge variant="secondary">{t.soon}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {t.items.map((item) => (
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
