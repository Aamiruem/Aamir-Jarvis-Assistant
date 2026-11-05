import Link from "next/link";

import { AzarvisMark } from "@/components/azarvis-logo";
import { SITE } from "@/lib/site";

const PRODUCT = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
  { href: "/dashboard", label: "Dashboard" },
];

const ACCOUNT = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

const CONNECT = [
  { href: SITE.authorUrl, label: "Portfolio", external: true },
  { href: "https://github.com/Aamiruem", label: "GitHub", external: true },
  { href: "https://www.linkedin.com/in/aamir-hussain-azad-62623924b", label: "LinkedIn", external: true },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string; external?: boolean }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">{title}</h2>
      {links.map((link) =>
        link.external ? (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        ) : (
          <Link key={link.label} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {link.label}
          </Link>
        ),
      )}
    </nav>
  );
}

/** Site footer, shared by the landing page and the sign-in and sign-up pages. */
export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex max-w-sm flex-col gap-4">
          <Link href="/" aria-label="Azarvis home" className="inline-flex w-fit items-center gap-2.5">
            <AzarvisMark className="size-8" />
            <span className="font-display text-lg font-bold tracking-[0.2em] text-primary">AZARVIS</span>
          </Link>
          <p className="text-sm leading-6 text-muted-foreground">
            Your personal AI voice assistant for tasks, reminders, documents and your computer.
          </p>
          <p className="text-sm text-muted-foreground">
            Created by{" "}
            <a href={SITE.authorUrl} target="_blank" rel="noopener author" className="font-medium text-foreground hover:underline">
              {SITE.author}
            </a>
            , {SITE.authorJobTitle}.
          </p>
        </div>

        <FooterColumn title="Product" links={PRODUCT} />
        <FooterColumn title="Account" links={ACCOUNT} />
        <FooterColumn title="Connect" links={CONNECT} />
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <p>© {SITE.copyrightYear} {SITE.name}. All rights reserved.</p>
          <p>Built with Claude, Next.js and FastAPI.</p>
        </div>
      </div>
    </footer>
  );
}
