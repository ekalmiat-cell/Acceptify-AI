"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { GoogleIcon, AppleIcon } from "@/components/auth/brand-icons";
import { getConfiguredSocialProviders } from "@/lib/auth-config";

export function SocialButtons() {
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "apple" | null
  >(null);
  const providers = getConfiguredSocialProviders();

  async function handleSocial(provider: "google" | "apple") {
    if (!providers[provider]) {
      toast.message(
        `${provider === "google" ? "Google" : "Apple"} sign-in is not configured yet. You can still create an account with email and password.`,
      );
      return;
    }

    setLoadingProvider(provider);

    try {
      const { error, data } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(error.message ?? "Could not continue with " + provider);
        setLoadingProvider(null);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Social sign in failed", err);
      toast.error("Social sign-in is unavailable right now.");
      setLoadingProvider(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        className="h-10"
        disabled={loadingProvider !== null}
        onClick={() => handleSocial("google")}
      >
        {loadingProvider === "google" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <GoogleIcon className="size-4" />
        )}
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-10"
        disabled={loadingProvider !== null}
        onClick={() => handleSocial("apple")}
      >
        {loadingProvider === "apple" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <AppleIcon className="size-4" />
        )}
        Apple
      </Button>
    </div>
  );
}
