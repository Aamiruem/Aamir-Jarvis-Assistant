import { ArrowUp, Code, ExternalLink, Mail } from "lucide-react";
import Link from "next/link";

import { AzarvisMark } from "@/components/azarvis-logo";
import { APP_URL, CONTACT_EMAIL, PROJECTS, SITE } from "@/lib/site";

type FooterLink = { href: string; label: string; external?: boolean; live?: boolean };

const AZARVIS: FooterLink[] = [
  { href: APP_URL, label: "Voice web app", external: true },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

const ACCOUNT: FooterLink[] = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

const CONNECT: FooterLink[] = [
  { href: SITE.authorUrl, label: "Portfolio", external: true },
  { href: "https://github.com/Aamiruem", label: "GitHub", external: true },
  { href: "https://www.linkedin.com/in/aamir-hussain-azad-62623924b", label: "LinkedIn", external: true },
  { href: "https://leetcode.com/u/Aamiruem/", label: "LeetCode", external: true },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Email" },
];

// Lucide no longer ships brand icons, so these two are drawn in the same stroke style.
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 3.5c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const SOCIAL = [
  { href: "https://github.com/Aamiruem", label: "GitHub", Icon: GitHubIcon },
  { href: "https://www.linkedin.com/in/aamir-hussain-azad-62623924b", label: "LinkedIn", Icon: LinkedInIcon },
  { href: "https://leetcode.com/u/Aamiruem/", label: "LeetCode", Icon: Code },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Email", Icon: Mail },
];

const linkClass = "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground";

function FooterLinkItem({ link }: { link: FooterLink }) {
  const extra = link.live ? (
    <span className="rounded-full bg-emerald-500/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
      Live
    </span>
  ) : null;
  if (link.external || link.href.startsWith("http") || link.href.startsWith("mailto:")) {
    const outside = !link.href.startsWith("mailto:");
    return (
      <a href={link.href} className={linkClass} {...(outside && { target: "_blank", rel: "noopener noreferrer" })}>
        {link.label}
        {extra}
      </a>
    );
  }
  return (
    <Link href={link.href} className={linkClass}>
      {link.label}
    </Link>
  );
}

function FooterColumn({ title, links, wide = false }: { title: string; links: FooterLink[]; wide?: boolean }) {
  return (
    <nav aria-label={title} className={wide ? "sm:col-span-2 md:col-span-1" : undefined}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">{title}</h2>
      <ul className={wide ? "grid gap-x-6 gap-y-2.5 sm:grid-cols-2" : "flex flex-col gap-2.5"}>
        {links.map((link) => (
          <li key={link.label}>
            <FooterLinkItem link={link} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Site footer. "full" on the landing and sign-in pages: the Azarvis apps, Aamir's other projects
 * and where to find him. "compact" under the signed-in dashboard pages: one quiet line.
 */
export function SiteFooter({ variant = "full" }: { variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <footer className="border-t px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            © {SITE.copyrightYear} {SITE.shortName} · Created by{" "}
            <a href={SITE.authorUrl} target="_blank" rel="noopener author" className="font-medium text-foreground hover:underline">
              {SITE.author}
            </a>
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Voice web app</a>
            <a href={SITE.authorUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Projects</a>
            <a href="https://github.com/Aamiruem" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
            <a href="https://www.linkedin.com/in/aamir-hussain-azad-62623924b" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">LinkedIn</a>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid w-full max-w-[1840px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(300px,1.2fr)_minmax(0,3fr)]">
        <div className="flex max-w-sm flex-col gap-4">
          <Link href="/" aria-label="Azarvis home" className="inline-flex w-fit items-center gap-2.5">
            <AzarvisMark className="size-8" />
            <span className="font-display text-lg font-bold tracking-[0.2em] text-primary">AZARVIS</span>
          </Link>
          <p className="text-sm leading-6 text-muted-foreground">
            Your personal AI voice assistant for tasks, reminders, study notes, documents and your computer.
          </p>
          <p className="text-sm text-muted-foreground">
            Created by{" "}
            <a href={SITE.authorUrl} target="_blank" rel="noopener author" className="font-medium text-foreground hover:underline">
              {SITE.author}
            </a>
            , {SITE.authorJobTitle}.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110"
            >
              Open the web app <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
            <Link href="/register" className="inline-flex items-center rounded-md border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted">
              Create account
            </Link>
          </div>
          <ul className="flex gap-2" aria-label="Find Aamir online">
            {SOCIAL.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(!href.startsWith("mailto:") && { target: "_blank", rel: "noopener noreferrer" })}
                  className="grid size-9 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,3fr)_minmax(0,0.9fr)_minmax(0,0.75fr)]">
          <FooterColumn title="Azarvis" links={AZARVIS} />
          <FooterColumn title="Projects" links={PROJECTS.map((p) => ({ ...p, external: true }))} wide />
          <FooterColumn title="Account" links={ACCOUNT} />
          <FooterColumn title="Connect" links={CONNECT} />
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex w-full max-w-[1840px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <p>© {SITE.copyrightYear} {SITE.name}. All rights reserved.</p>
          <p>Built with Claude, Next.js, React and FastAPI.</p>
          <a href="#top" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowUp className="size-3.5" aria-hidden="true" /> Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
