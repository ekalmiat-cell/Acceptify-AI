import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { SocialSection } from "@/components/auth/social-section";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatOAuthCallbackError,
  sanitizeRedirectPath,
} from "@/lib/auth-config";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    meta: "Create your account",
    title: "Create your account",
    subtitle: "Get your first AI admission prediction in under two minutes.",
    socialBefore: "By continuing with Google or Apple you also agree to our",
    terms: "Terms of Use",
    and: "and",
    privacy: "Privacy Policy",
    socialAfter: ". Under 18? Please ask a parent or guardian first.",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
  },
  ru: {
    meta: "Регистрация",
    title: "Создай аккаунт",
    subtitle: "Первый прогноз поступления с ИИ — меньше чем за две минуты.",
    socialBefore: "Продолжая через Google или Apple, ты тоже принимаешь наши",
    terms: "Условия использования",
    and: "и",
    privacy: "Политику конфиденциальности",
    socialAfter: ". Тебе меньше 18? Сначала спроси родителя или опекуна.",
    haveAccount: "Уже есть аккаунт?",
    signIn: "Войти",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].meta };
}

export const dynamic = "force-dynamic";

type SignUpPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = copy[locale];
  const callbackURL = sanitizeRedirectPath(params.redirect);
  const oauthError = formatOAuthCallbackError(params.error, locale);

  const errorCallbackURL = `/sign-up${
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
        <SignUpForm callbackURL={callbackURL} />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        {t.socialBefore}{" "}
        <Link href="/terms" className="text-primary hover:underline">
          {t.terms}
        </Link>{" "}
        {t.and}{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          {t.privacy}
        </Link>
        {t.socialAfter}
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t.haveAccount}{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          {t.signIn}
        </Link>
      </p>
    </div>
  );
}
