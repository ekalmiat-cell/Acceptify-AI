import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Choose a new password",
    expired: "This reset link has expired or was already used. Reset links are valid for one hour and work once.",
    sendNew: "Send a new link",
    hint: "Pick something you haven't used elsewhere — you'll be signed in with it right after.",
  },
  ru: {
    title: "Новый пароль",
    expired: "Ссылка для сброса истекла или уже использована. Такие ссылки действуют час и срабатывают один раз.",
    sendNew: "Отправить новую ссылку",
    hint: "Выбери пароль, который не используешь на других сайтах, — сразу после этого войдёшь с ним.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].title };
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;
  const t = copy[await getLocale()];

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <h1 className="font-heading text-2xl font-semibold text-foreground">
        {t.title}
      </h1>

      {/* Better Auth appends ?error=INVALID_TOKEN when the link is stale. */}
      {!token || error ? (
        <>
          <Alert variant="destructive" className="mt-6">
            <TriangleAlert />
            <AlertDescription>{t.expired}</AlertDescription>
          </Alert>

          <Link
            href="/forgot-password"
            className={buttonVariants({ className: "mt-6 h-10 w-full" })}
          >
            {t.sendNew}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.hint}</p>

          <div className="mt-6">
            <ResetPasswordForm token={token} />
          </div>
        </>
      )}
    </div>
  );
}
