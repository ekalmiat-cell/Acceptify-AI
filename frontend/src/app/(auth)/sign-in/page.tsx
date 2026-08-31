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
  title: "Sign in | Acceptify AI",
};

export const dynamic = "force-dynamic";

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
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sign in with your verified Google account to view your admissions predictions and saved universities.
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
          buttonText="Continue with Google"
        />
      </div>

      <p className="text-center text-xs text-muted-foreground leading-relaxed pt-4 border-t">
        By continuing, you agree to Acceptify AI&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
