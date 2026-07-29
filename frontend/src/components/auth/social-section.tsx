import { SocialButtons } from "@/components/auth/social-buttons";
import { getConfiguredSocialProviders } from "@/lib/auth-config";

type SocialSectionProps = {
  /** Where to land after a successful sign-in. */
  callbackURL: string;
  /** Page to return to when the OAuth round trip fails. */
  errorCallbackURL: string;
};

/**
 * Server component: reads which OAuth credentials exist in the server
 * environment (they are non-`NEXT_PUBLIC_`, so a client component could not)
 * and hands the result to the buttons. Both buttons always render — a
 * provider without credentials says so on click rather than disappearing.
 */
export function SocialSection({
  callbackURL,
  errorCallbackURL,
}: SocialSectionProps) {
  const providers = getConfiguredSocialProviders();

  return (
    <>
      <div className="mt-8">
        <SocialButtons
          providers={providers}
          callbackURL={callbackURL}
          errorCallbackURL={errorCallbackURL}
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
