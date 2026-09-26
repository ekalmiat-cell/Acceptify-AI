"use client";

import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/lib/env.client";

/** In the browser, always talk to the origin the page was served from. */
const getBaseURL = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
