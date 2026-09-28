"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    passwordLength: "Use at least 8 characters.",
    repeat: "Repeat your new password.",
    mismatch: "Passwords don't match.",
    invalidLink: "That reset link is no longer valid. Request a new one.",
    updated: "Password updated — sign in with it now.",
    newPassword: "New password",
    atLeast: "At least 8 characters",
    confirm: "Confirm new password",
    repeatPlaceholder: "Repeat it",
    update: "Update password",
    remembered: "Remembered it?",
    signIn: "Sign in",
  },
  ru: {
    passwordLength: "Минимум 8 символов.",
    repeat: "Повтори новый пароль.",
    mismatch: "Пароли не совпадают.",
    invalidLink: "Эта ссылка для сброса больше не действует. Запроси новую.",
    updated: "Пароль обновлён — теперь войди с ним.",
    newPassword: "Новый пароль",
    atLeast: "Минимум 8 символов",
    confirm: "Повтори новый пароль",
    repeatPlaceholder: "Ещё раз",
    update: "Обновить пароль",
    remembered: "Вспомнился пароль?",
    signIn: "Войти",
  },
});

export function ResetPasswordForm({ token }: { token: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t.passwordLength),
          confirmPassword: z.string().min(1, t.repeat),
        })
        .refine((values) => values.password === values.confirmPassword, {
          path: ["confirmPassword"],
          message: t.mismatch,
        }),
    [t],
  );
  type ResetPasswordValues = z.infer<typeof schema>;

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setIsSubmitting(true);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      toast.error(formatAuthError(error.message, t.invalidLink, locale));
      setIsSubmitting(false);
      return;
    }

    toast.success(t.updated);
    router.push("/sign-in");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.newPassword}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t.atLeast}
                  autoComplete="new-password"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.confirm}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t.repeatPlaceholder}
                  autoComplete="new-password"
                  className="h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {t.update}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.remembered}{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            {t.signIn}
          </Link>
        </p>
      </form>
    </Form>
  );
}
