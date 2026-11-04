import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionSplash } from "@/components/dashboard/session-splash";
import { StoreProvider } from "@/components/store-provider";

// Everything under /dashboard waits on the signed-in session (SessionSplash), so there is no
// static shell for Next's instant-navigation check to validate; opting out silences that dev error.
export const instant = false;

// Signed-in pages: nothing here for search engines (robots.txt disallows /dashboard as well).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<SessionSplash />}>
      <StoreProvider>
        <DashboardShell>{children}</DashboardShell>
      </StoreProvider>
    </Suspense>
  );
}
