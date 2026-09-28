"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Installable-app plumbing: registers the service worker (public/sw.js) and
 * holds on to the browser's install prompt so the Settings card can offer a
 * one-tap "Install" button.
 *
 * `beforeinstallprompt` fires once, early, on whatever page the student
 * opens first — usually not Settings — so it is captured here, app-wide,
 * and kept until someone asks for it.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState =
  /** Server render and first paint — nothing known yet. */
  | "unknown"
  /** Already running as the installed app. */
  | "installed"
  /** The browser handed us its install prompt: a button can install. */
  | "promptable"
  /** iPhone/iPad Safari: only "Share → Add to Home Screen" works. */
  | "ios"
  /** Any other browser: install from its own menu, if it supports it. */
  | "manual";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  // iPadOS reports itself as a Mac; touch support gives it away.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getState(): InstallState {
  if (justInstalled || isStandalone()) return "installed";
  if (deferredPrompt) return "promptable";
  if (isIos()) return "ios";
  return "manual";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getState, () => "unknown");
}

/** Shows the browser's own install dialog. Resolves to whether it was accepted. */
export async function promptInstall(): Promise<boolean> {
  const prompt = deferredPrompt;
  if (!prompt) return false;
  deferredPrompt = null;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  notify();
  return outcome === "accepted";
}

/** Mounted once in the app root. */
export function usePwaSetup() {
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      notify();
    };
    const onInstalled = () => {
      deferredPrompt = null;
      justInstalled = true;
      notify();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Dev server bundles change on every save; a worker there only gets in
    // the way. Production is where installs happen.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Not fatal: the site works the same without it, just not installable.
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
}
