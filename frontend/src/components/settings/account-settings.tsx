"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, TriangleAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authClient, useSession } from "@/lib/auth-client";

export function AccountSettings() {
  const { data: session, refetch } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const email = session?.user?.email ?? "";
  const dirty = name.trim().length > 0 && name !== session?.user?.name;

  async function handleSave() {
    setIsSaving(true);
    const { error } = await authClient.updateUser({ name: name.trim() });
    if (error) {
      toast.error(error.message ?? "Could not update your profile.");
    } else {
      toast.success("Profile updated");
      await refetch();
    }
    setIsSaving(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 max-w-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="h-9 max-w-sm" />
            <p className="text-xs text-muted-foreground">
              Contact support to change your email address.
            </p>
          </div>
          <div>
            <Button onClick={handleSave} disabled={!dirty || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Irreversible account actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Delete account</AlertTitle>
            <AlertDescription>
              Permanently deletes your profile, predictions, and saved
              universities. This preview environment doesn&apos;t have account
              deletion wired up yet — contact support to request removal.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" className="mt-4" disabled>
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
