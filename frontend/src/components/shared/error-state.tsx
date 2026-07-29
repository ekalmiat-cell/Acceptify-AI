"use client";

import { RefreshCw, ServerCrash, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

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
  // `ApiError` loses its prototype when Next serializes a server-component
  // error, so match on the message the transport sets.
  const isOffline =
    error.message.includes("Can't reach the Acceptify API") ||
    error.message.includes("took too long to respond");

  const Icon = isOffline ? WifiOff : ServerCrash;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>

      <h1 className="mt-5 font-heading text-xl font-semibold text-foreground">
        {isOffline ? "Can't reach the server" : "Something went wrong"}
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {isOffline
          ? "Your data is safe — the Acceptify API just isn't answering right now. It may still be starting up."
          : "This page hit an unexpected error. Trying again usually clears it."}
      </p>

      {process.env.NODE_ENV === "development" ? (
        <p className="mt-3 max-w-md break-words rounded-md bg-muted px-3 py-2 text-left font-mono text-xs text-muted-foreground">
          {error.message}
        </p>
      ) : null}

      <Button className="mt-6 h-10" onClick={reset}>
        <RefreshCw />
        Try again
      </Button>
    </div>
  );
}
