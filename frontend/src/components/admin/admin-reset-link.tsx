"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    failed: "Could not create the link.",
    copied: "Link copied",
    title: "Password reset link",
    note: "For a student who forgot their password and wrote on Telegram. The link works once, for one hour. Send it only to the account owner — e.g. ask for the name they signed up with first.",
    email: "Student's email",
    create: "Create link",
    copy: "Copy",
  },
  ru: {
    failed: "Не удалось создать ссылку.",
    copied: "Ссылка скопирована",
    title: "Ссылка для сброса пароля",
    note: "Для ученика, который забыл пароль и написал в Telegram. Ссылка срабатывает один раз и действует час. Отправляй её только владельцу аккаунта — например, сначала спроси имя, указанное при регистрации.",
    email: "Почта ученика",
    create: "Создать ссылку",
    copy: "Копировать",
  },
});

/**
 * Password resets during the beta: a student writes on Telegram, the admin
 * creates a link here and sends it back. Replaces email until the site has
 * its own domain.
 */
export function AdminResetLink() {
  const t = useCopy(copy);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setLink(null);
    try {
      const data = await apiFetch<{ url: string }>("/api/v1/admin/reset-link", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setLink(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.failed);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success(t.copied);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.note}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="reset-email">{t.email}</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
            />
          </div>
          <Button type="submit" disabled={isLoading || email.trim().length === 0}>
            {isLoading ? <Loader2 className="animate-spin" /> : null}
            {t.create}
          </Button>
        </form>

        {link ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
            <code className="min-w-0 flex-1 truncate text-xs">{link}</code>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy />
              {t.copy}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
