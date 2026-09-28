import type { Metadata } from "next";

import { Logo } from "@/components/shared/logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isMailDeliverable } from "@/lib/email";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Reset your password",
    withMail: "Enter the email you signed up with and we'll send you a link to choose a new password.",
    withoutMail: "Forgot your password? We'll get you back in.",
  },
  ru: {
    title: "Сброс пароля",
    withMail: "Введи почту своего аккаунта — мы пришлём ссылку для нового пароля.",
    withoutMail: "Не помнишь пароль? Поможем вернуться.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].title };
}

export default async function ForgotPasswordPage() {
  const t = copy[await getLocale()];
  const mailDeliverable = isMailDeliverable();

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <h1 className="font-heading text-2xl font-semibold text-foreground">
        {t.title}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{mailDeliverable ? t.withMail : t.withoutMail}</p>

      <div className="mt-6">
        {/*
          Server component: whether mail can actually go out is a server-side
          fact (RESEND_API_KEY / EMAIL_FROM are not NEXT_PUBLIC_), so it is
          resolved here and handed down. Without it the form would promise a
          message that never arrives.
        */}
        <ForgotPasswordForm mailConfigured={mailDeliverable} />
      </div>
    </div>
  );
}
