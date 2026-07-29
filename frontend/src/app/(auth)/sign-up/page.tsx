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

export const metadata: Metadata = {
  title: "Create your account",
};

type SignUpPageProps = {
  searchParams: Promise<{ redirect?: string; error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const callbackURL = sanitizeRedirectPath(params.redirect);
  const oauthError = formatOAuthCallbackError(params.error);

  const errorCallbackURL = `/sign-up${
    params.redirect ? `?redirect=${encodeURIComponent(callbackURL)}` : ""
  }`;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Get your first AI admission prediction in under two minutes.
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
        <SignUpForm callbackURL={callbackURL} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
