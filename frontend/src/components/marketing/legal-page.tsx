import type { ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { siteConfig } from "@/config/site";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    updated: `Last updated ${siteConfig.legalUpdated}`,
    orEmail: "or email",
  },
  ru: {
    updated: "Обновлено 28 сентября 2026 г.",
    orEmail: "или почта",
  },
});

/** Shared frame for the Privacy Policy and Terms of Use. */
export async function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  const t = copy[await getLocale()];
  return (
    <section className="relative pt-32 pb-24 sm:pt-40">
      <Container className="max-w-3xl">
        <p className="text-sm font-medium text-white/50">{t.updated}</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <div className="mt-6 text-base leading-relaxed text-white/70">{intro}</div>
        <div className="mt-12 flex flex-col gap-10">{children}</div>
      </Container>
    </section>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-white/70 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-medium [&_strong]:text-white/90 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** "Telegram @… or email …" — the one way we ask people to reach us. */
export async function ContactLine() {
  const t = copy[await getLocale()];
  return (
    <>
      Telegram{" "}
      <a href={siteConfig.contact.telegramUrl} target="_blank" rel="noreferrer">
        {siteConfig.contact.telegram}
      </a>{" "}
      {t.orEmail} <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
    </>
  );
}
