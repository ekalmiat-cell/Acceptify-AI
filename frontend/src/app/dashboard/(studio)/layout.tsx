import type { ReactNode } from "react";

import { StudioTabs } from "@/components/dashboard/page-tabs";

/** Essay review, training and interview practice: one studio, switched at the top. */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StudioTabs />
      {children}
    </>
  );
}
