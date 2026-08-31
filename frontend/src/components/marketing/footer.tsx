import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050e1c]">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-10">
        <div className="flex flex-col gap-4">
          <Logo dark />
          <p className="max-w-xs text-sm leading-relaxed text-white/50">
            Admission analysis and application strategy for students applying
            to universities worldwide. Every score is an estimate based on your
            profile and available university data — never an admission
            guarantee.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {siteConfig.socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="flex size-8 items-center justify-center rounded-full border border-white/10 text-xs font-medium text-white/60 transition-colors hover:border-white/25 hover:text-white"
              >
                {social.label.slice(0, 1)}
              </Link>
            ))}
          </div>
        </div>

        <FooterColumn title="Product" links={siteConfig.footerNav.product} />
        <FooterColumn title="Company" links={siteConfig.footerNav.company} />
        <FooterColumn title="Legal" links={siteConfig.footerNav.legal} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-white/40 sm:flex-row md:px-10">
          <p>© {new Date().getFullYear()} Acceptify AI. All rights reserved.</p>
          <p>Built for students navigating admissions worldwide.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-white">{title}</span>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
