import type { ReactNode } from "react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    // overflow-x-clip: stamps and tilted cards animate in from off-screen and
    // must not widen a phone page while they wait.
    <div className="flex flex-1 flex-col overflow-x-clip bg-mk-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
