import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatOAuthCallbackError,
  sanitizeRedirectPath,
} from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "Create your account | Acceptify AI",
};

export const dynamic = "force-dynamic";

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
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sign up with your verified Google account to get your admissions fit score in under two minutes.
        </p>
      </div>

      {oauthError ? (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{oauthError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="pt-2">
        <GoogleSignInButton
          callbackURL={callbackURL}
          errorCallbackURL={errorCallbackURL}
          buttonText="Sign up with Google"
        />
      </div>

      <p className="text-center text-xs text-muted-foreground leading-relaxed pt-4 border-t">
        By continuing, you agree to Acceptify AI&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
