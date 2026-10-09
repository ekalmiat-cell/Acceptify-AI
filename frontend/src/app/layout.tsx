import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono, Unbounded } from "next/font/google";
import Script from "next/script";
import { AppProviders } from "@/components/providers/app-providers";
import { siteConfig } from "@/config/site";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Display headings: a wide, confident face that has Cyrillic. */
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
});

/** Handwritten notes in the margins. */
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic"],
  weight: ["600"],
});

const copy = defineCopy({
  en: { description: siteConfig.description as string },
  ru: {
    description:
      "Платформа с ИИ для поступления в университеты: помогает спланировать, собрать и подать сильную заявку.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: {
      default: siteConfig.name,
      template: `%s · ${siteConfig.name}`,
    },
    description: copy[locale].description,
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    // Lets iPhone "Add to Home Screen" open full-screen, like the installed
    // app on Android and Windows (see app/manifest.ts).
    appleWebApp: { capable: true, title: siteConfig.shortName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  // The site is white by default; the browser bar follows the device theme.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1f3a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${unbounded.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders locale={locale}>{children}</AppProviders>
        {/*
          Vercel Web Analytics: cookieless page-view counts, served by Vercel
          itself at this path once Analytics is enabled for the project. Only
          production deployments have the endpoint, so nowhere else loads it.
          (A script tag rather than @vercel/analytics: the package's optional
          SvelteKit peer clashes with vitest's vite during npm install.)
        */}
        {process.env.VERCEL_ENV === "production" ? (
          <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
