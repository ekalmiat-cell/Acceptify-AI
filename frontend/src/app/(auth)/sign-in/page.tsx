import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { SocialButtons } from "@/components/auth/social-buttons";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
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

      <div className="mt-8">
        <SocialButtons />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <SignInForm />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create one for free
        </Link>
      </p>
    </div>
  );
}
