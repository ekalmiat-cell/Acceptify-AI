"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { GoogleIcon, AppleIcon } from "@/components/auth/brand-icons";
import {
  formatAuthError,
  socialProviderLabels,
  type SocialProvider,
  type SocialProvidersConfig,
} from "@/lib/auth-config";

const providerIcons: Record<
  SocialProvider,
  (props: { className?: string }) => React.ReactNode
> = {
  google: GoogleIcon,
  apple: AppleIcon,
};

type SocialButtonsProps = {
  /**
   * Which providers have server-side credentials. Computed in a server
   * component — `process.env.GOOGLE_CLIENT_ID` and friends are not available
   * in the browser bundle.
   */
  providers: SocialProvidersConfig;
  /** Where to land after a successful round trip. */
  callbackURL?: string;
  /** Where Better Auth sends the browser when the OAuth round trip fails. */
  errorCallbackURL?: string;
};

export function SocialButtons({
  providers,
  callbackURL = "/dashboard",
  errorCallbackURL = "/sign-in",
}: SocialButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(
    null,
  );

  // Both buttons always render — signing up with Google or Apple is a
  // first-class path, so the option stays visible. A provider without
  // server-side credentials explains itself on click instead of vanishing.
  const allProviders = Object.keys(providerIcons) as SocialProvider[];

  async function handleSocial(provider: SocialProvider) {
    const label = socialProviderLabels[provider];

    if (!providers[provider]) {
      toast.message(
        `${label} sign-in isn't connected yet — you can still create an account with your email below.`,
      );
      return;
    }

    setLoadingProvider(provider);

    try {
      const { error, data } = await authClient.signIn.social({
        provider,
        callbackURL,
        newUserCallbackURL: callbackURL,
        errorCallbackURL,
      });

      if (error) {
        toast.error(
          formatAuthError(error.message, `Could not continue with ${label}.`),
        );
        setLoadingProvider(null);
        return;
      }

      if (data?.url) {
        // Hand the browser off to the provider's consent screen. The spinner
        // stays up on purpose — this page is being replaced.
        window.location.href = data.url;
        return;
      }

      setLoadingProvider(null);
    } catch (err) {
      console.error("Social sign in failed", err);
      toast.error("Social sign-in is unavailable right now.");
      setLoadingProvider(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {allProviders.map((provider) => {
        const Icon = providerIcons[provider];
        const label = socialProviderLabels[provider];

        return (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="h-10"
            disabled={loadingProvider !== null}
            aria-label={`Continue with ${label}`}
            onClick={() => handleSocial(provider)}
          >
            {loadingProvider === provider ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Icon className="size-4" />
            )}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
