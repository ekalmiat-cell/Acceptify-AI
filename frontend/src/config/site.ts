export const siteConfig = {
  name: "Acceptify AI",
  shortName: "Acceptify",
  description:
    "An AI-powered university admissions platform that helps students plan, build, and submit standout applications.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  marketingNav: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "What you get", href: "/#features" },
    { label: "Live demo", href: "/#ai-demo" },
    { label: "Universities", href: "/#universities" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
  footerNav: {
    product: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "What you get", href: "/#features" },
      { label: "Live demo", href: "/#ai-demo" },
      { label: "Universities", href: "/#universities" },
      { label: "Pricing", href: "/pricing" },
    ],
    contact: [
      { label: "Telegram", href: "https://t.me/ekowlss" },
      { label: "Email", href: "mailto:ekalmiat@gmail.com" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
  /** Where students reach a person: support, bug reports, data requests. */
  contact: {
    operator: "Elarys Kalmiuatuly",
    country: "Republic of Kazakhstan",
    email: "ekalmiat@gmail.com",
    telegram: "@ekowlss",
    telegramUrl: "https://t.me/ekowlss",
  },
  /** Official social accounts — left empty until they exist. */
  socials: [] as readonly { label: string; href: string }[],
  /** Date the current Privacy Policy and Terms of Use took effect. */
  legalUpdated: "29 September 2026",
} as const;
