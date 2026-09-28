"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, LogIn, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    validEmail: "Enter a valid email address.",
    enterPassword: "Enter your password.",
    invalid: "Invalid email or password.",
    welcome: "Welcome back!",
    failed: "We couldn't sign you in. Either the password is wrong, or this email has no account yet.",
    reset: "Reset your password",
    or: "or",
    create: "create an account",
    throttled: "Too many attempts in a row — your password may well be right. Wait about a minute and try again.",
    email: "Email",
    password: "Password",
    forgot: "Forgot password?",
    keepSignedIn: "Keep me signed in",
    signIn: "Sign in",
  },
  ru: {
    validEmail: "Введи корректную почту.",
    enterPassword: "Введи пароль.",
    invalid: "Неверная почта или пароль.",
    welcome: "С возвращением!",
    failed: "Не получилось войти. Либо пароль неверный, либо на эту почту ещё нет аккаунта.",
    reset: "Сбросить пароль",
    or: "или",
    create: "создать аккаунт",
    throttled: "Слишком много попыток подряд — возможно, пароль верный. Подожди около минуты и попробуй снова.",
    email: "Почта",
    password: "Пароль",
    forgot: "Не помнишь пароль?",
    keepSignedIn: "Запомнить меня",
    signIn: "Войти",
  },
});

export function SignInForm({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<"credentials" | "throttled" | null>(
    null,
  );

  const schema = useMemo(
    () =>
      z.object({
        email: z.email(t.validEmail),
        password: z.string().min(1, t.enterPassword),
        rememberMe: z.boolean(),
      }),
    [t],
  );
  type SignInValues = z.infer<typeof schema>;

  const form = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: SignInValues) {
    setIsSubmitting(true);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      // Persistent cookie that survives closing the browser (30 days, see
      // `session.expiresIn` in lib/auth.ts). Unchecked, the cookie is
      // session-scoped and disappears with the browser window.
      rememberMe: values.rememberMe,
      callbackURL,
    });

    if (error) {
      // 429 means the attempt never reached the password check at all —
      // saying "invalid password" there sends people off resetting a password
      // that was probably right.
      setFailure(error.status === 429 ? "throttled" : "credentials");
      toast.error(formatAuthError(error.message, t.invalid, locale));
      setIsSubmitting(false);
      return;
    }

    setFailure(null);
    toast.success(t.welcome);
    router.push(callbackURL);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/*
          The server answers "Invalid email or password" for both a wrong
          password and an address that was never registered — deliberately, so
          the form can't be used to discover who has an account. That leaves
          people stuck retrying a correct password for an account that doesn't
          exist here, so spell out both ways forward instead.
        */}
        {failure === "credentials" ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>
              <span>{t.failed}</span>
              <span className="mt-1 block">
                <Link href="/forgot-password" className="font-medium underline">
                  {t.reset}
                </Link>{" "}
                {t.or}{" "}
                <Link href="/sign-up" className="font-medium underline">
                  {t.create}
                </Link>
                .
              </span>
            </AlertDescription>
          </Alert>
        ) : null}

        {failure === "throttled" ? (
          <Alert>
            <TriangleAlert />
            <AlertDescription>{t.throttled}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.email}</FormLabel>
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
                <FormLabel>{t.password}</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t.forgot}
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
                {t.keepSignedIn}
              </FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <LogIn />}
          {t.signIn}
        </Button>
      </form>
    </Form>
  );
}
