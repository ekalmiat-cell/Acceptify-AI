"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, TriangleAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { formatAuthError } from "@/lib/auth-config";

const schema = z.object({
  email: z.email("Enter a valid email address."),
});

type ForgotPasswordValues = z.infer<typeof schema>;

export function ForgotPasswordForm({
  /** Whether the server can actually deliver mail — see lib/email.ts. */
  mailConfigured,
}: {
  mailConfigured: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsSubmitting(true);

    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });

    if (error) {
      toast.error(
        formatAuthError(error.message, "Could not send the reset link."),
      );
      setIsSubmitting(false);
      return;
    }

    // Deliberately identical whether or not the address has an account —
    // otherwise this page becomes a way to check who is registered.
    setSentTo(values.email);
    setIsSubmitting(false);

    // Development convenience only; the route behind this 404s in production.
    const res = await fetch(
      `/api/auth-dev/reset-link?email=${encodeURIComponent(values.email)}`,
    ).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (data?.url) setDevLink(data.url as string);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant={mailConfigured ? "default" : "destructive"}>
          {mailConfigured ? <Mail /> : <TriangleAlert />}
          <AlertDescription>
            {mailConfigured ? (
              <>
                If an account exists for <strong>{sentTo}</strong>, a reset
                link is on its way. It works for one hour — check your spam
                folder too.
              </>
            ) : (
              // Saying "check your email" when no mail provider is configured
              // just makes people wait for something that will never arrive.
              <>
                Email delivery isn&apos;t set up on this site yet, so no
                message can be sent. The reset link was recorded in the server
                log — ask whoever runs Acceptify to pass it to you.
              </>
            )}
          </AlertDescription>
        </Alert>

        {devLink ? (
          <Alert>
            <AlertDescription className="break-all">
              <span className="font-medium">Development mode:</span> email
              delivery isn&apos;t configured, so here is the link directly —{" "}
              <a href={devLink} className="text-primary underline">
                set a new password
              </a>
            </AlertDescription>
          </Alert>
        ) : null}

        <Link
          href="/sign-in"
          className={buttonVariants({ variant: "outline", className: "h-10" })}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Warn before the click, not after — nobody should wait on an inbox
            for a message the server cannot send. */}
        {!mailConfigured ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>
              Email delivery isn&apos;t configured yet, so a reset link cannot
              be emailed to you. Ask the site owner to set it up, or sign in
              with a different method.
            </AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Mail />}
          Send reset link
        </Button>
      </form>
    </Form>
  );
}
