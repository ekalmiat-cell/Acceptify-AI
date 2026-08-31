"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { GoogleIcon } from "@/components/auth/brand-icons";
import { formatAuthError } from "@/lib/auth-config";

interface GoogleSignInButtonProps {
  isConfigured: boolean;
  callbackURL?: string;
  errorCallbackURL?: string;
  buttonText?: string;
}

export function GoogleSignInButton({
  isConfigured,
  callbackURL = "/dashboard",
  errorCallbackURL = "/sign-in",
  buttonText = "Continue with Google",
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleSignIn() {
    if (!isConfigured) {
      toast.error(
        "Google Sign-In is not configured yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables."
      );
      return;
    }

    setIsLoading(true);
    try {
      const { error, data } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL,
      });

      if (error) {
        toast.error(formatAuthError(error.message, "Could not sign in with Google."));
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Google sign in error", err);
      toast.error("Google sign-in is temporarily unavailable.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={isLoading}
        onClick={handleGoogleSignIn}
        className="w-full h-12 gap-3 text-sm font-semibold shadow-xs hover:bg-muted/50 border-input transition-all"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        <span>{buttonText}</span>
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Secure sign-in via verified Google Account</span>
      </div>
    </div>
  );
}
