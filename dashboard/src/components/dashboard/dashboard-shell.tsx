"use client";

import { motion } from "framer-motion";
import { Brain, CheckSquare, FileText, LayoutDashboard, LogOut, Map, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AzarvisLogo } from "@/components/azarvis-logo";
import { SessionSplash } from "@/components/dashboard/session-splash";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/memories", label: "Memories", icon: Brain },
  { href: "/dashboard/map", label: "Weather map", icon: Map },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") router.replace("/login");
  }, [status, router]);

  if (status !== "signed-in") return <SessionSplash />;

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b bg-sidebar md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/" aria-label="Azarvis home">
            <AzarvisLogo markClassName="size-7" />
          </Link>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Dashboard" className="overflow-x-auto px-2 pb-2 md:pb-0">
          <ul className="flex gap-1 md:flex-col">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <li key={href} className="relative">
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-md bg-primary/15"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                      active ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 border-b px-4 py-3 sm:px-6">
          <span className="mr-auto truncate text-sm text-muted-foreground">
            Signed in as <strong className="text-foreground">{user?.name}</strong>
          </span>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut /> Sign out
          </Button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
