import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AppProviders } from "@/components/providers/app-providers";
import { siteConfig } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
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
