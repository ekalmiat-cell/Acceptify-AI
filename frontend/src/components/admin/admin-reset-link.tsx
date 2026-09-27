"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";

/**
 * Password resets during the beta: a student writes on Telegram, the admin
 * creates a link here and sends it back. Replaces email until the site has
 * its own domain.
 */
export function AdminResetLink() {
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
      toast.error(error instanceof Error ? error.message : "Could not create the link.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copied");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Password reset link
        </CardTitle>
        <CardDescription>
          For a student who forgot their password and wrote on Telegram. The
          link works once, for one hour. Send it only to the account owner —
          e.g. ask for the name they signed up with first.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="reset-email">Student&apos;s email</Label>
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
            Create link
          </Button>
        </form>

        {link ? (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
            <code className="min-w-0 flex-1 truncate text-xs">{link}</code>
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy />
              Copy
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
