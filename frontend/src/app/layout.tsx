import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  themeColor: "#0b1f3a",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
