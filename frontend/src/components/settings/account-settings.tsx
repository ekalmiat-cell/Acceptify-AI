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
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    updateFailed: "Could not update your profile.",
    updated: "Profile updated",
    details: "Account details",
    detailsDescription: "Update your personal information.",
    fullName: "Full name",
    email: "Email",
    changeEmailBefore: "To change your email, write to us on",
    changeEmailOr: "or at",
    save: "Save changes",
    confirmWord: "DELETE",
    reauth: "For your safety, sign out and sign in again, then delete the account.",
    wrongPassword: "That password is not correct.",
    deleteFailed: "Could not delete your account.",
    deleted: "Your account and all its data have been deleted.",
    danger: "Danger zone",
    dangerDescription: "Irreversible account actions.",
    deleteAccount: "Delete account",
    deleteWarning:
      "Permanently deletes your account, academic profile, achievements, predictions, essay reviews and training progress. This cannot be undone.",
    dialogTitle: "Delete your account?",
    dialogDescription: "All your data will be erased right away. There is no way to restore it.",
    yourPassword: "Your password",
    typeBefore: "Type",
    typeAfter: "to confirm",
    cancel: "Cancel",
    deleteForever: "Delete forever",
  },
  ru: {
    updateFailed: "Не удалось обновить профиль.",
    updated: "Профиль обновлён",
    details: "Данные аккаунта",
    detailsDescription: "Измени свои личные данные.",
    fullName: "Имя и фамилия",
    email: "Почта",
    changeEmailBefore: "Чтобы сменить почту, напиши нам в",
    changeEmailOr: "или на",
    save: "Сохранить",
    confirmWord: "УДАЛИТЬ",
    reauth: "Для безопасности выйди и войди снова, а затем удали аккаунт.",
    wrongPassword: "Неверный пароль.",
    deleteFailed: "Не удалось удалить аккаунт.",
    deleted: "Аккаунт и все его данные удалены.",
    danger: "Опасная зона",
    dangerDescription: "Действия, которые нельзя отменить.",
    deleteAccount: "Удалить аккаунт",
    deleteWarning:
      "Навсегда удаляет аккаунт, академический профиль, достижения, прогнозы, разборы эссе и прогресс тренировок. Отменить это нельзя.",
    dialogTitle: "Удалить аккаунт?",
    dialogDescription: "Все данные будут стёрты сразу. Восстановить их будет невозможно.",
    yourPassword: "Твой пароль",
    typeBefore: "Введи",
    typeAfter: "для подтверждения",
    cancel: "Отмена",
    deleteForever: "Удалить навсегда",
  },
});

export function AccountSettings() {
  const t = useCopy(copy);
  const { data: session, refetch } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const email = session?.user?.email ?? "";
  const dirty = name.trim().length > 0 && name !== session?.user?.name;

  async function handleSave() {
    setIsSaving(true);
    const { error } = await authClient.updateUser({ name: name.trim() });
    if (error) {
      toast.error(error.message ?? t.updateFailed);
    } else {
      toast.success(t.updated);
      await refetch();
    }
    setIsSaving(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.details}</CardTitle>
          <CardDescription>{t.detailsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t.fullName}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 max-w-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input id="email" value={email} disabled className="h-9 max-w-sm" />
            <p className="text-xs text-muted-foreground">
              {t.changeEmailBefore}{" "}
              <a
                href={siteConfig.contact.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Telegram {siteConfig.contact.telegram}
              </a>{" "}
              {t.changeEmailOr} {siteConfig.contact.email}.
            </p>
          </div>
          <div>
            <Button onClick={handleSave} disabled={!dirty || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              {t.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteAccountCard />
    </div>
  );
}

/**
 * Permanently deletes the account and everything stored for it (see
 * lib/data/account.ts). Email accounts confirm with their password; Google
 * and Apple accounts have none, so Better Auth instead requires a session
 * signed in within the last day.
 */
function DeleteAccountCard() {
  const t = useCopy(copy);
  const CONFIRM_WORD = t.confirmWord;
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
        toast.error(t.reauth);
      } else if (error.code === "INVALID_PASSWORD") {
        toast.error(t.wrongPassword);
      } else {
        toast.error(error.message ?? t.deleteFailed);
      }
      return;
    }
    toast.success(t.deleted);
    router.replace("/");
    router.refresh();
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">{t.danger}</CardTitle>
        <CardDescription>{t.dangerDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{t.deleteAccount}</AlertTitle>
          <AlertDescription>{t.deleteWarning}</AlertDescription>
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
            {t.deleteAccount}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.dialogTitle}</DialogTitle>
              <DialogDescription>{t.dialogDescription}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {hasPassword ? (
                <div className="grid gap-2">
                  <Label htmlFor="delete-password">{t.yourPassword}</Label>
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
                  {t.typeBefore} <span className="font-mono font-semibold">{CONFIRM_WORD}</span> {t.typeAfter}
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
              <DialogClose render={<Button variant="outline" />}>{t.cancel}</DialogClose>
              <Button variant="destructive" onClick={handleDelete} disabled={!canDelete}>
                {isDeleting ? <Loader2 className="animate-spin" /> : null}
                {t.deleteForever}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
