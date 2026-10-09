import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { SocialSection } from "@/components/auth/social-section";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatOAuthCallbackError,
  sanitizeRedirectPath,
} from "@/lib/auth-config";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";

const copy = defineCopy({
  en: {
    meta: "Sign in",
    title: "Welcome back",
    subtitle: "Sign in to see your latest predictions and saved universities.",
    noAccount: "Don't have an account?",
    create: "Create one for free",
  },
  ru: {
    meta: "Вход",
    title: "С возвращением",
    subtitle: "Войди, чтобы увидеть свои прогнозы и сохранённые университеты.",
    noAccount: "Ещё нет аккаунта?",
    create: "Создай бесплатно",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].meta };
}

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = copy[locale];
  const callbackURL = sanitizeRedirectPath(params.redirect);
  // Already signed in: straight on, never the form again. A real session
  // check, not just the cookie, so a stale cookie can't loop back here.
  if (await getSession()) redirect(/^\/(sign-in|sign-up)/.test(callbackURL) ? "/dashboard" : callbackURL);
  const oauthError = formatOAuthCallbackError(params.error, locale);

  const errorCallbackURL = `/sign-in${
    params.redirect ? `?redirect=${encodeURIComponent(callbackURL)}` : ""
  }`;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <h1 className="font-heading text-2xl font-semibold text-foreground">
        {t.title}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>

      {oauthError ? (
        <Alert variant="destructive" className="mt-6">
          <TriangleAlert />
          <AlertDescription>{oauthError}</AlertDescription>
        </Alert>
      ) : null}

      <SocialSection
        callbackURL={callbackURL}
        errorCallbackURL={errorCallbackURL}
      />

      <div className="mt-6">
        <SignInForm callbackURL={callbackURL} />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t.noAccount}{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          {t.create}
        </Link>
      </p>
    </div>
  );
}
