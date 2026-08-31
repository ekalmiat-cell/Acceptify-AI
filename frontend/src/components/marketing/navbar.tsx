"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-[#071326]/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        <Link href="/" className="shrink-0">
          <Logo dark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {siteConfig.marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {!isPending && session ? (
            <Button
              render={<Link href="/dashboard" />}
              className="bg-gradient-brand text-white hover:opacity-90"
            >
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button
                render={<Link href="/sign-in" />}
                variant="ghost"
                className="text-white/80 hover:bg-white/5 hover:text-white"
              >
                Sign in
              </Button>
              <Button
                render={<Link href="/sign-up" />}
                className="bg-gradient-brand text-white shadow-glow-brand hover:opacity-90"
              >
                Check My Chances
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 lg:hidden"
              />
            }
          >
            <Menu />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#071326] text-white">
            <SheetHeader>
              <SheetTitle className="text-white">
                <Logo dark />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {siteConfig.marketingNav.map((item) => (
                <SheetClose
                  key={item.href}
                  render={<Link href={item.href} />}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
                >
                  {item.label}
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-white/10 p-4">
              {!isPending && session ? (
                <Button render={<Link href="/dashboard" />} className="bg-gradient-brand text-white">
                  Go to dashboard
                </Button>
              ) : (
                <>
                  <Button render={<Link href="/sign-in" />} variant="outline" className="border-white/15 text-white">
                    Sign in
                  </Button>
                  <Button render={<Link href="/sign-up" />} className="bg-gradient-brand text-white">
                    Check My Chances
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
