"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    fullNameError: "Enter your full name.",
    validEmail: "Enter a valid email address.",
    passwordLength: "Use at least 8 characters.",
    consentError: "Please accept the Terms and Privacy Policy to continue.",
    failed: "Could not create your account.",
    created: "Account created — welcome to Acceptify AI!",
    fullName: "Full name",
    namePlaceholder: "Aidana Kenzhebayeva",
    email: "Email",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    agree: "I agree to the",
    terms: "Terms of Use",
    and: "and",
    privacy: "Privacy Policy",
    minor: ". If I am under 18, my parent or guardian has read them and agrees.",
    create: "Create account",
  },
  ru: {
    fullNameError: "Введи имя и фамилию.",
    validEmail: "Введи корректную почту.",
    passwordLength: "Минимум 8 символов.",
    consentError: "Чтобы продолжить, прими Условия использования и Политику конфиденциальности.",
    failed: "Не удалось создать аккаунт.",
    created: "Аккаунт создан — добро пожаловать в Acceptify AI!",
    fullName: "Имя и фамилия",
    namePlaceholder: "Айдана Кенжебаева",
    email: "Почта",
    password: "Пароль",
    passwordPlaceholder: "Минимум 8 символов",
    agree: "Я принимаю",
    terms: "Условия использования",
    and: "и",
    privacy: "Политику конфиденциальности",
    minor: ". Если мне меньше 18 лет, мой родитель или опекун прочитал их и согласен.",
    create: "Создать аккаунт",
  },
});

export function SignUpForm({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t.fullNameError),
        email: z.email(t.validEmail),
        password: z.string().min(8, t.passwordLength),
        // Consent to the Terms and Privacy Policy, and — for students under 18 —
        // a parent's or guardian's agreement. Required by Kazakhstan's personal
        // data law before we store anything about the student.
        consent: z.boolean().refine((value) => value, t.consentError),
      }),
    [t],
  );
  type SignUpValues = z.infer<typeof schema>;

  const form = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", consent: false },
  });

  async function onSubmit(values: SignUpValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL,
    });

    if (error) {
      toast.error(formatAuthError(error.message, t.failed, locale));
      setIsSubmitting(false);
      return;
    }

    toast.success(t.created);
    router.push(callbackURL);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.fullName}</FormLabel>
              <FormControl>
                <Input placeholder={t.namePlaceholder} autoComplete="name" className="h-10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormLabel>{t.password}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t.passwordPlaceholder}
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
          name="consent"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start gap-2">
                <FormControl>
                  <Checkbox
                    className="mt-0.5"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <FormLabel className="block text-xs leading-relaxed font-normal text-muted-foreground">
                  {t.agree}{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline">
                    {t.terms}
                  </Link>{" "}
                  {t.and}{" "}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                    {t.privacy}
                  </Link>
                  {t.minor}
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="mt-2 h-10" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
          {t.create}
        </Button>
      </form>
    </Form>
  );
}
