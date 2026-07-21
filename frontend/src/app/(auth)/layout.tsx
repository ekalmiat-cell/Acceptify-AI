import type { ReactNode } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <AuthPanel />
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-16">
        {children}
      </div>
    </div>
  );
}
