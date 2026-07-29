import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { SocialSection } from "@/components/auth/social-section";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatOAuthCallbackError,
  sanitizeRedirectPath,
} from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "Sign in",
};

type SignInPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackURL = sanitizeRedirectPath(params.redirect);
  const oauthError = formatOAuthCallbackError(params.error);

  const errorCallbackURL = `/sign-in${
    params.redirect ? `?redirect=${encodeURIComponent(callbackURL)}` : ""
  }`;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Sign in to see your latest predictions and saved universities.
      </p>

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
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create one for free
        </Link>
      </p>
    </div>
  );
}
