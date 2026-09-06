"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";
import { clientEnv } from "@/lib/env.client";

const getBaseURL = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [jwtClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
