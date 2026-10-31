import { Suspense } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionSplash } from "@/components/dashboard/session-splash";
import { StoreProvider } from "@/components/store-provider";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<SessionSplash />}>
      <StoreProvider>
        <DashboardShell>{children}</DashboardShell>
      </StoreProvider>
    </Suspense>
  );
}
