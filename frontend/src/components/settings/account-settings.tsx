"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
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
              To change your email, write to us on{" "}
              <a
                href={siteConfig.contact.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Telegram {siteConfig.contact.telegram}
              </a>{" "}
              or at {siteConfig.contact.email}.
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

      <DeleteAccountCard />
    </div>
  );
}

const CONFIRM_WORD = "DELETE";

/**
 * Permanently deletes the account and everything stored for it (see
 * lib/data/account.ts). Email accounts confirm with their password; Google
 * and Apple accounts have none, so Better Auth instead requires a session
 * signed in within the last day.
 */
function DeleteAccountCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open || hasPassword !== null) return;
    authClient.listAccounts().then(({ data }) => {
      setHasPassword(Boolean(data?.some((account) => account.providerId === "credential")));
    });
  }, [open, hasPassword]);

  const canDelete =
    confirmText.trim() === CONFIRM_WORD &&
    hasPassword !== null &&
    (!hasPassword || password.length > 0) &&
    !isDeleting;

  async function handleDelete() {
    setIsDeleting(true);
    const { error } = await authClient.deleteUser(hasPassword ? { password } : {});
    if (error) {
      setIsDeleting(false);
      if (error.code === "SESSION_EXPIRED") {
        toast.error("For your safety, sign out and sign in again, then delete the account.");
      } else if (error.code === "INVALID_PASSWORD") {
        toast.error("That password is not correct.");
      } else {
        toast.error(error.message ?? "Could not delete your account.");
      }
      return;
    }
    toast.success("Your account and all its data have been deleted.");
    router.replace("/");
    router.refresh();
  }

  return (
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
            Permanently deletes your account, academic profile, achievements,
            predictions and essay reviews. This cannot be undone.
          </AlertDescription>
        </Alert>

        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setPassword("");
              setConfirmText("");
            }
          }}
        >
          <DialogTrigger render={<Button variant="destructive" className="mt-4" />}>
            Delete account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                All your data will be erased right away. There is no way to
                restore it.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {hasPassword ? (
                <div className="grid gap-2">
                  <Label htmlFor="delete-password">Your password</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="delete-confirm">
                  Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  autoComplete="off"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button variant="destructive" onClick={handleDelete} disabled={!canDelete}>
                {isDeleting ? <Loader2 className="animate-spin" /> : null}
                Delete forever
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
