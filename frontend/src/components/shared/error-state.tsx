"use client";

import { RefreshCw, ServerCrash, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    offlineTitle: "Can't reach the server",
    errorTitle: "Something went wrong",
    offlineBody: "Your data is safe — the Acceptify API just isn't answering right now. It may still be starting up.",
    errorBody: "This page hit an unexpected error. Trying again usually clears it.",
    digest: "Error digest",
    unknown: "unknown",
    retry: "Try again",
  },
  ru: {
    offlineTitle: "Сервер недоступен",
    errorTitle: "Что-то пошло не так",
    offlineBody: "Твои данные в безопасности — просто сервер Acceptify сейчас не отвечает. Возможно, он ещё запускается.",
    errorBody: "На странице произошла непредвиденная ошибка. Обычно помогает попробовать ещё раз.",
    digest: "Код ошибки",
    unknown: "неизвестен",
    retry: "Попробовать снова",
  },
});

/**
 * Shared body for the route-level error boundaries. A backend that is down or
 * restarting is by far the most common failure in development, so it gets its
 * own wording and a retry button instead of a stack trace.
 */
export function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useCopy(copy);
  // `ApiError` loses its prototype when Next serializes a server-component
  // error, so match on the message the transport sets.
  const isOffline =
    error.message.includes("Can't reach") ||
    error.message.includes("took too long to respond") ||
    error.message.includes("Не удаётся связаться") ||
    error.message.includes("слишком долго не отвечает");

  const Icon = isOffline ? WifiOff : ServerCrash;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>

      <h1 className="mt-5 font-heading text-xl font-semibold text-foreground">
        {isOffline ? t.offlineTitle : t.errorTitle}
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isOffline ? t.offlineBody : t.errorBody}
      </p>

      <p className="mt-3 max-w-md break-words rounded-md bg-muted px-3 py-2 text-left font-mono text-xs text-muted-foreground">
        {error.message || `${t.digest}: ${error.digest ?? t.unknown}`}
      </p>

      <Button className="mt-6 h-10" onClick={reset}>
        <RefreshCw />
        {t.retry}
      </Button>
    </div>
  );
}
