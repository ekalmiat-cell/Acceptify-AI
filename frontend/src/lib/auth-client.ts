"use client";

import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";
import { clientEnv } from "@/lib/env.client";

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
  plugins: [jwtClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
