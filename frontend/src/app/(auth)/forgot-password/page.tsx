import type { Metadata } from "next";

import { Logo } from "@/components/shared/logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col gap-2 lg:hidden">
        <Logo />
      </div>

      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Reset your password
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Enter the email you signed up with and we&apos;ll send you a link to
        choose a new password.
      </p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
