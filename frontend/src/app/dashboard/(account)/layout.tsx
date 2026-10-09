import type { ReactNode } from "react";

import { AccountTabs } from "@/components/dashboard/page-tabs";

/** The profile and the application portfolio: one place, switched at the top. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AccountTabs />
      {children}
    </>
  );
}
