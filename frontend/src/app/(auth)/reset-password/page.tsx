import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Choose a new password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Choose a new password
      </h1>

      {/* Better Auth appends ?error=INVALID_TOKEN when the link is stale. */}
      {!token || error ? (
        <>
          <Alert variant="destructive" className="mt-6">
            <TriangleAlert />
            <AlertDescription>
              This reset link has expired or was already used. Reset links are
              valid for one hour and work once.
            </AlertDescription>
          </Alert>

          <Link
            href="/forgot-password"
            className={buttonVariants({ className: "mt-6 h-10 w-full" })}
          >
            Send a new link
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick something you haven&apos;t used elsewhere — you&apos;ll be
            signed in with it right after.
          </p>

          <div className="mt-6">
            <ResetPasswordForm token={token} />
          </div>
        </>
      )}
    </div>
  );
}
