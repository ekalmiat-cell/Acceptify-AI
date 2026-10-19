"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import { defineCopy, type Locale } from "@/lib/i18n/core";
import { cn, formatTenge } from "@/lib/utils";
import type { PricingTier } from "@/types/domain";

/** The Kaspi account paid tiers are transferred to, by phone number. */
const KASPI_PHONE = "87088127383";
const KASPI_PHONE_SHOWN = "8 708 812 73 83";

const copy = defineCopy({
  en: {
    title: (name: string) => `Pay for ${name} with Kaspi`,
    description: "A transfer by phone number in the Kaspi app. We switch the plan on by hand once it arrives.",
    step1: "Open Kaspi → Transfers → By phone number.",
    step2: "Send to this number:",
    step3: "Amount:",
    step4: "In the message to the recipient, write your name and the plan:",
    sample: (name: string) => `Your name, ${name}`,
    after: "We check the transfer and switch the plan on for the account with that name. Something wrong? Write to us on Telegram",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Couldn't copy. Select the text and copy it instead.",
    month: "a month",
  },
  ru: {
    title: (name: string) => `Оплата ${name} через Kaspi`,
    description: "Перевод по номеру телефона в приложении Kaspi. Тариф включаем вручную, как только придёт перевод.",
    step1: "Открой Kaspi → Переводы → По номеру телефона.",
    step2: "Переведи на этот номер:",
    step3: "Сумма:",
    step4: "В сообщении получателю напиши своё имя и тариф:",
    sample: (name: string) => `Твоё имя, ${name}`,
    after: "Проверим перевод и включим тариф аккаунту с этим именем. Что-то не так — напиши нам в Telegram",
    copy: "Копировать",
    copied: "Скопировано",
    copyFailed: "Не удалось скопировать. Выдели текст и скопируй вручную.",
    month: "в месяц",
  },
});

export function KaspiPayDialog({
  tier,
  locale,
  triggerClassName,
}: {
  tier: PricingTier;
  locale: Locale;
  triggerClassName?: string;
}) {
  const t = copy[locale];
  return (
    <Dialog>
      <DialogTrigger render={<Button className={triggerClassName} />}>{tier.cta}</DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{t.title(tier.name)}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col gap-4 text-sm">
          <Step n={1}>{t.step1}</Step>
          <Step n={2}>
            {t.step2}
            <CopyRow t={t} shown={KASPI_PHONE_SHOWN} value={KASPI_PHONE} />
          </Step>
          <Step n={3}>
            {t.step3}
            <CopyRow
              t={t}
              shown={`${formatTenge(tier.price, locale)} ${t.month}`}
              value={String(tier.price)}
            />
          </Step>
          <Step n={4}>
            {t.step4}
            <span className="mt-1.5 block -rotate-1 font-hand text-2xl leading-none text-[#e5484d]">
              {t.sample(tier.name)}
            </span>
          </Step>
        </ol>

        <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {t.after}{" "}
          <a
            href={siteConfig.contact.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            {siteConfig.contact.telegram}
          </a>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-xs font-semibold text-background">
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </li>
  );
}

function CopyRow({ t, shown, value }: { t: (typeof copy)["en"]; shown: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copyValue = async () => {
    try {
      await writeClipboard(value);
      setCopied(true);
      toast.success(t.copied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t.copyFailed);
    }
  };
  return (
    <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <span className="font-mono text-base font-semibold tracking-wide select-all">{shown}</span>
      <Button type="button" size="sm" variant="outline" onClick={copyValue} className={cn(copied && "text-emerald-600")}>
        {copied ? <Check /> : <Copy />}
        {copied ? t.copied : t.copy}
      </Button>
    </div>
  );
}

/**
 * The Clipboard API, falling back to a hidden textarea and execCommand —
 * in-app browsers (Telegram, Instagram) often refuse the API.
 */
async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy failed");
  }
}
