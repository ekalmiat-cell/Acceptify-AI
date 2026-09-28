"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    plan: "Current plan",
    planDescription: "Acceptify is free while in beta — every feature is unlocked.",
    badge: "Free beta",
    saved: "Saved analyses",
    unlimited: "unlimited",
    paidSoon: "Paid plans are coming later",
    staysFree: "Everything free today stays free.",
    seePlans: "See plans",
    payment: "Payment method",
    paymentDescription: "No payment method is needed during the free beta.",
  },
  ru: {
    plan: "Текущий тариф",
    planDescription: "Пока идёт бета, Acceptify бесплатный — открыты все функции.",
    badge: "Бесплатная бета",
    saved: "Сохранённые анализы",
    unlimited: "без ограничений",
    paidSoon: "Платные тарифы появятся позже",
    staysFree: "Всё, что бесплатно сегодня, останется бесплатным.",
    seePlans: "Тарифы",
    payment: "Способ оплаты",
    paymentDescription: "Во время бесплатной беты оплата не нужна.",
  },
});

/**
 * Acceptify is free during beta, so there is no plan to manage and nothing to
 * pay. This card says so plainly instead of showing a usage meter for a
 * limit that is not enforced.
 */
export function BillingSettings({ predictionsUsed }: { predictionsUsed: number }) {
  const t = useCopy(copy);
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.plan}</CardTitle>
              <CardDescription>{t.planDescription}</CardDescription>
            </div>
            <Badge>{t.badge}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t.saved}</span>
            <span className="font-mono text-muted-foreground">
              {predictionsUsed} · {t.unlimited}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted p-4">
            <div className="flex items-center gap-3">
              <span className="bg-gradient-brand flex size-9 items-center justify-center rounded-lg text-white">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{t.paidSoon}</p>
                <p className="text-xs text-muted-foreground">{t.staysFree}</p>
              </div>
            </div>
            <Button render={<Link href="/pricing" />} variant="outline">
              {t.seePlans}
              <ArrowRight />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.payment}</CardTitle>
          <CardDescription>{t.paymentDescription}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
