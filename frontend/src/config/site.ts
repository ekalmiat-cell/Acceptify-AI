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
    company: [
      { label: "About", href: "/#" },
      { label: "Blog", href: "/#" },
      { label: "Careers", href: "/#" },
      { label: "Contact", href: "/#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/#" },
      { label: "Terms of Service", href: "/#" },
      { label: "Cookie Policy", href: "/#" },
    ],
  },
  socials: [
    { label: "X", href: "https://x.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Instagram", href: "https://instagram.com" },
  ],
} as const;
