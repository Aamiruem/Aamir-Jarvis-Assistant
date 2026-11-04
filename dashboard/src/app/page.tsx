import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckSquare,
  Eye,
  FileText,
  Laptop,
  Mic,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JarvisOrb } from "@/components/jarvis-orb";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const FEATURES = [
  { icon: Mic, title: "Hands-free conversation", body: "Just talk. Jarvis keeps listening, answers out loud in a natural voice, and stops the moment you interrupt." },
  { icon: CheckSquare, title: "Tasks & reminders", body: "“Remind me to call the bank at 11.” Jarvis sets it, and notifies you when it's due." },
  { icon: Brain, title: "Long-term memory", body: "Tell Jarvis about yourself once. It remembers your name, city and preferences, and you can edit them any time." },
  { icon: FileText, title: "Chat with your documents", body: "Upload PDFs and notes, then ask questions. Jarvis answers from your files and names its sources." },
  { icon: Laptop, title: "Controls your computer", body: "Open apps and files, change the volume, take screenshots and lock the screen on Windows, macOS or Linux." },
  { icon: Eye, title: "Vision", body: "Show Jarvis a photo or your screen and ask what's on it, or let it greet you when you walk into the room." },
  { icon: BarChart3, title: "Usage analytics", body: "See what you ask about most, how you feel about it, and how fast Jarvis answers." },
  { icon: ShieldCheck, title: "Bank-grade sign-in", body: "One-time codes, account lockout, short-lived tokens and httpOnly refresh cookies keep your account yours." },
];

const STEPS = [
  { title: "Say hello", body: "Open Jarvis and tap Start talking. It greets you and reads today's reminders." },
  { title: "Let Jarvis get to know you", body: "The first time, it asks a few quick questions (what to call you, your city, your work) and remembers the answers." },
  { title: "Talk like you would to a person", body: "Ask several things at once, change your mind mid-sentence, or interrupt. Jarvis keeps up." },
];

const EXAMPLES = [
  "Remind me to drink water at 4 pm",
  "What's the weather in Mumbai?",
  "Open my resume",
  "Summarize what I just copied",
  "What's 18% GST on 24,999?",
  "Email Priya that I'm running late",
  "What's on my screen?",
  "Play lofi music on YouTube",
];

const FAQ = [
  {
    q: "What is Jarvis?",
    a: "Jarvis is a personal AI voice assistant powered by Anthropic's Claude. You talk to it (or type), and it manages your tasks and reminders, remembers what matters to you, answers questions about your documents and controls your computer.",
  },
  {
    q: "Does Jarvis work hands-free?",
    a: "Yes. In voice mode the microphone stays open, so you can just keep talking. Jarvis starts answering after your first pause, reads its reply aloud sentence by sentence, and stops as soon as you talk over it. “Hey Jarvis” mode only reacts when you say its name.",
  },
  {
    q: "Which browsers and computers are supported?",
    a: "Voice works best in Google Chrome and Microsoft Edge. Computer control works on Windows, macOS and Linux when the Jarvis AI service runs on that computer.",
  },
  {
    q: "Is my data private?",
    a: "Your tasks, memories, documents and chats are stored per account and only you can see them. Room Watch measures motion in the browser and detects faces on your own PC; no camera image is sent anywhere for it. You can delete your account and all of its data at any time.",
  },
  {
    q: "Can I run Jarvis on my own computer?",
    a: "Yes. The whole stack (the React app, the Node.js API and the Python AI service) runs on your own computer or server with your own Claude API key. That is also what lets Jarvis open apps and files on your PC.",
  },
];

// Structured data: tells Google this is a web application, with an FAQ it can show in results.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: SITE.name,
      url: SITE.url,
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Windows, macOS, Linux, Web",
      description: SITE.description,
      author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl, sameAs: [...SITE.authorProfiles] },
      featureList: FEATURES.map((f) => f.title),
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
};

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

// A Server Component: rendered to static HTML at build time, so it is fast and fully
// crawlable. Only the orb and the theme button ship JavaScript to the browser.
export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-lg font-bold tracking-[0.2em] text-primary sm:text-xl sm:tracking-[0.3em]">
            J.A.R.V.I.S.
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Main" className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" className="max-sm:px-2" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button className="max-sm:px-3" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="relative overflow-hidden">
          <div aria-hidden="true" className="hero-glow" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-24">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium tracking-wide text-primary">
                <Sparkles className="size-3.5" aria-hidden="true" /> Personal AI assistant · Powered by Claude
              </p>
              <h1 id="hero-title" className="text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-6xl">
                The AI voice assistant that <span className="text-gradient">gets things done.</span>
              </h1>
              <p className="mt-6 max-w-prose text-lg text-muted-foreground">
                Talk to Jarvis like you would to a person. It sets your reminders, keeps your tasks, remembers what
                matters to you, reads your documents and runs your computer, all hands-free.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get started <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <li>✓ Hands-free voice</li>
                <li>✓ Windows, macOS &amp; Linux</li>
                <li>✓ Private by design</li>
              </ul>
            </div>

            <div className="relative flex justify-center">
              <JarvisOrb className="[--orb-size:15rem] sm:[--orb-size:21rem]" />
              <figure className="absolute bottom-0 left-0 max-w-[16rem] rounded-2xl rounded-bl-sm border bg-card/90 px-4 py-3 text-sm shadow-lg backdrop-blur sm:left-2">
                <figcaption className="sr-only">Example request</figcaption>
                “Remind me to call mom at 6, and what&apos;s the weather in Pune?”
              </figure>
              <figure className="absolute top-2 right-0 max-w-[15rem] rounded-2xl rounded-tr-sm border border-primary/30 bg-primary/10 px-4 py-3 text-sm shadow-lg backdrop-blur sm:right-2">
                <figcaption className="sr-only">Jarvis replies</figcaption>
                Done, I&apos;ll remind you at 6 PM. Pune is 31° and sunny.
              </figure>
            </div>
          </div>
        </section>

        <section aria-label="Highlights" className="border-y bg-card/50">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:px-6 md:grid-cols-4">
            {[
              ["20+", "built-in skills"],
              ["3", "ways to talk"],
              ["Live", "replies spoken as they stream"],
              ["3", "desktop platforms"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-3xl font-bold text-primary">{value}</dd>
                <dd className="text-sm text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <p className="text-sm font-medium tracking-widest text-primary uppercase">Features</p>
          <h2 id="features-title" className="reveal mt-2 text-3xl font-bold sm:text-4xl">
            What you can do with Jarvis
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="reveal">
                <article className="group h-full rounded-xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <span className="inline-grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 border-y bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium tracking-widest text-primary uppercase">How it works</p>
              <h2 id="how-title" className="reveal mt-2 text-3xl font-bold sm:text-4xl">
                A conversation, not a command line
              </h2>
              <ol className="mt-10 space-y-8">
                {STEPS.map(({ title, body }, i) => (
                  <li key={title} className="reveal flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{title}</h3>
                      <p className="mt-1 text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="reveal self-center rounded-2xl border bg-background p-6 shadow-sm">
              <h3 className="font-semibold">Things to say</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {EXAMPLES.map((e) => (
                  <li key={e} className="rounded-full border bg-card px-3 py-1.5 text-sm">
                    “{e}”
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-muted-foreground">
                Several requests in one breath work too: Jarvis does them all and confirms each one.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
          <h2 id="faq-title" className="text-center text-3xl font-bold sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 divide-y rounded-xl border bg-card">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  <h3 className="font-sans text-base font-medium tracking-normal">{q}</h3>
                  <span aria-hidden="true" className="text-xl text-primary transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6">
          <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-card px-6 py-14 text-center shadow-sm">
            <div aria-hidden="true" className="hero-glow" />
            <h2 id="cta-title" className="relative text-3xl font-bold sm:text-4xl">
              Ready to meet your assistant?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
              Create an account in a minute. Jarvis will greet you and ask a few questions to get to know you.
            </p>
            <Button size="lg" className="relative mt-8" asChild>
              <Link href="/register">
                Get started <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <p>
            <span className="font-display font-bold tracking-[0.2em] text-primary">J.A.R.V.I.S.</span> · {SITE.name} by{" "}
            <a href={SITE.authorUrl} target="_blank" rel="noopener author" className="font-medium text-foreground hover:underline">
              {SITE.author}
            </a>
          </p>
          <nav aria-label="Footer" className="flex gap-5">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-foreground">
                {n.label}
              </a>
            ))}
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
