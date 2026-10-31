import { BarChart3, Brain, CheckSquare, Map, MessageSquare, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { AosInit } from "@/components/aos-init";
import { JarvisOrb } from "@/components/jarvis-orb";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: MessageSquare, title: "Streaming chat", body: "Answers appear as Jarvis writes them, with the tools it used along the way." },
  { icon: CheckSquare, title: "Tasks & reminders", body: "Add tasks with a reminder time; Jarvis notifies you when they're due." },
  { icon: Brain, title: "Long-term memory", body: "Facts Jarvis remembers about you, which you can search and remove at any time." },
  { icon: BarChart3, title: "Usage analytics", body: "What you ask about, how you feel about it, and how fast Jarvis answers." },
  { icon: Map, title: "Weather map", body: "Click anywhere on the map for the current weather there." },
  { icon: ShieldCheck, title: "Bank-grade sign-in", body: "One-time codes, short-lived tokens in memory, and httpOnly refresh cookies." },
];

// A Server Component: rendered to static HTML at build time. Only the orb, the theme
// button and the AOS initializer ship JavaScript to the browser.
export default function LandingPage() {
  return (
    <>
      <AosInit />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-bold tracking-[0.2em] text-primary sm:text-xl sm:tracking-[0.3em]">
          J.A.R.V.I.S.
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" className="max-sm:px-2" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="max-sm:px-3" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </nav>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 text-sm font-medium tracking-widest text-primary uppercase">Your AI assistant</p>
            <h1 id="hero-title" className="text-4xl font-bold sm:text-5xl lg:text-6xl">
              Everything Jarvis knows and does, in one dashboard.
            </h1>
            <p className="mt-5 max-w-prose text-lg text-muted-foreground">
              Chat with Jarvis, keep track of tasks and reminders, look after what it remembers, and see how you use it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">See features</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <JarvisOrb className="[--orb-size:16rem] sm:[--orb-size:22rem]" />
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="features-title" className="text-3xl font-bold" data-aos="fade-up">
            What you can do
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <li key={title} data-aos="fade-up" data-aos-delay={i * 80}>
                <article className="h-full rounded-xl border bg-card p-6 shadow-sm">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <p>Aamir Jarvis Assistant</p>
          <p>Built with Next.js, TypeScript and Tailwind CSS</p>
        </div>
      </footer>
    </>
  );
}
