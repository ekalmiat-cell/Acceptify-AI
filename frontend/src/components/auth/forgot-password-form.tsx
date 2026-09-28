"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Send, TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { siteConfig } from "@/config/site";
import { authClient } from "@/lib/auth-client";
import { formatAuthError } from "@/lib/auth-config";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy, useLocale } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    validEmail: "Enter a valid email address.",
    failed: "Could not send the reset link.",
    sentBefore: "If an account exists for ",
    sentAfter:
      ", a reset link is on its way. It works for one hour — check your spam folder too. Nothing after a few minutes? Write to ",
    onTelegram: " on Telegram.",
    noMail:
      "Email delivery isn't set up on this site yet, so no message can be sent. The reset link was recorded in the server log — ask whoever runs Acceptify to pass it to you.",
    devMode: "Development mode:",
    devNote: " email delivery isn't configured, so here is the link directly — ",
    setNew: "set a new password",
    back: "Back to sign in",
    warn: "Email delivery isn't configured yet, so a reset link cannot be emailed to you. Ask the site owner to set it up, or sign in with a different method.",
    email: "Email",
    send: "Send reset link",
    telegramBefore: "During the beta, password resets are handled by hand. Message ",
    telegramAfter:
      " on Telegram with the email you signed up with, and you'll get a link to choose a new password — usually within minutes. The link works for one hour.",
    writeTelegram: "Write on Telegram",
    noTelegram: "No Telegram? Email ",
    social: ". If you signed up with Google or Apple, just use that button to sign in — there is no password to reset.",
  },
  ru: {
    validEmail: "Введи корректную почту.",
    failed: "Не удалось отправить ссылку для сброса.",
    sentBefore: "Если аккаунт с почтой ",
    sentAfter:
      " существует, ссылка для сброса уже в пути. Она действует час — проверь и папку «Спам». Через несколько минут ничего нет? Напиши ",
    onTelegram: " в Telegram.",
    noMail:
      "Отправка писем на сайте пока не настроена, поэтому письмо не придёт. Ссылка для сброса записана в журнал сервера — попроси владельца Acceptify передать её тебе.",
    devMode: "Режим разработки:",
    devNote: " почта не настроена, поэтому вот ссылка напрямую — ",
    setNew: "задать новый пароль",
    back: "Назад ко входу",
    warn: "Отправка писем пока не настроена, поэтому ссылку для сброса нельзя прислать на почту. Попроси владельца сайта настроить её или войди другим способом.",
    email: "Почта",
    send: "Отправить ссылку",
    telegramBefore: "Во время беты пароли сбрасываются вручную. Напиши ",
    telegramAfter:
      " в Telegram и укажи почту своего аккаунта — получишь ссылку для нового пароля, обычно за несколько минут. Ссылка действует час.",
    writeTelegram: "Написать в Telegram",
    noTelegram: "Нет Telegram? Напиши на ",
    social: ". Если аккаунт создан через Google или Apple, просто войди этой кнопкой — пароля для сброса нет.",
  },
});

export function ForgotPasswordForm({
  /** Whether mail reaches any student — see isMailDeliverable in lib/email.ts. */
  mailConfigured,
}: {
  mailConfigured: boolean;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const schema = useMemo(() => z.object({ email: z.email(t.validEmail) }), [t]);
  type ForgotPasswordValues = z.infer<typeof schema>;

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsSubmitting(true);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });

    if (error) {
      toast.error(formatAuthError(error.message, t.failed, locale));
      setIsSubmitting(false);
      return;
    }

    // Deliberately identical whether or not the address has an account —
    // otherwise this page becomes a way to check who is registered.
    setSentTo(values.email);
    setIsSubmitting(false);

    // Development convenience only; the route behind this 404s in production.
    const res = await fetch(
      `/api/auth-dev/reset-link?email=${encodeURIComponent(values.email)}`,
    ).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (data?.url) setDevLink(data.url as string);
  }

  // Beta without an email domain: resets go through the founder on Telegram.
  // (Development keeps the form, which shows the link on the page.)
  if (!mailConfigured && process.env.NODE_ENV === "production") {
    return <TelegramResetHelp />;
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant={mailConfigured ? "default" : "destructive"}>
          {mailConfigured ? <Mail /> : <TriangleAlert />}
          <AlertDescription>
            {mailConfigured ? (
              <>
                {t.sentBefore}
                <strong>{sentTo}</strong>
                {t.sentAfter}
                <a
                  href={siteConfig.contact.telegramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {siteConfig.contact.telegram}
                </a>
                {t.onTelegram}
              </>
            ) : (
              // Saying "check your email" when no mail provider is configured
              // just makes people wait for something that will never arrive.
              <>{t.noMail}</>
            )}
          </AlertDescription>
        </Alert>

        {devLink ? (
          <Alert>
            <AlertDescription className="break-all">
              <span className="font-medium">{t.devMode}</span>
              {t.devNote}
              <a href={devLink} className="text-primary underline">
                {t.setNew}
              </a>
            </AlertDescription>
          </Alert>
        ) : null}

        <Link href="/sign-in" className={buttonVariants({ variant: "outline", className: "h-10" })}>
          {t.back}
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Warn before the click, not after — nobody should wait on an inbox
            for a message the server cannot send. */}
        {!mailConfigured ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{t.warn}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.email}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Mail />}
          {t.send}
        </Button>
      </form>
    </Form>
  );
}

function TelegramResetHelp() {
  const t = useCopy(copy);
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Send />
        <AlertDescription>
          {t.telegramBefore}
          <strong>{siteConfig.contact.telegram}</strong>
          {t.telegramAfter}
        </AlertDescription>
      </Alert>
      <a
        href={siteConfig.contact.telegramUrl}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ className: "h-10" })}
      >
        <Send />
        {t.writeTelegram}
      </a>
      <p className="text-center text-xs text-muted-foreground">
        {t.noTelegram}
        <a href={`mailto:${siteConfig.contact.email}`} className="underline">
          {siteConfig.contact.email}
        </a>
        {t.social}
      </p>
      <Link href="/sign-in" className={buttonVariants({ variant: "outline", className: "h-10" })}>
        {t.back}
      </Link>
    </div>
  );
}
