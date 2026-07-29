"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean(),
});

type SignInValues = z.infer<typeof schema>;

export function SignInForm({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function attemptSignIn(values: SignInValues) {
    return authClient.signIn.email({
      email: values.email,
      password: values.password,
      // Persistent cookie that survives closing the browser (30 days, see
      // `session.expiresIn` in lib/auth.ts). Unchecked, the cookie is
      // session-scoped and disappears with the browser window.
      rememberMe: values.rememberMe,
      callbackURL,
    });
  }

  async function onSubmit(values: SignInValues) {
    setIsSubmitting(true);
    let { error } = await attemptSignIn(values);

    if (error) {
      // Recovers accounts left in a broken state by a past signup bug
      // (user created, but its password was never saved) — repair only
      // fires for that specific case, then retries with the same password.
      const repairRes = await fetch("/api/auth-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      }).catch(() => null);
      const repair = await repairRes?.json().catch(() => null);

      if (repair?.repaired) {
        ({ error } = await attemptSignIn(values));
      }
    }

    if (error) {
      toast.error(formatAuthError(error.message, "Invalid email or password."));
      setIsSubmitting(false);
      return;
    }

    toast.success("Welcome back!");
    router.push(callbackURL);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal text-muted-foreground">
                Keep me signed in
              </FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
          Sign in
        </Button>
      </form>
    </Form>
  );
}
