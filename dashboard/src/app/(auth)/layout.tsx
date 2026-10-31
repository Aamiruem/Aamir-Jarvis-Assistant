import Link from "next/link";

import { JarvisOrb } from "@/components/jarvis-orb";

// Route group "(auth)": shares this centered layout without adding "/auth" to the URL.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex flex-col items-center gap-3" aria-label="Jarvis home">
          <JarvisOrb className="[--orb-size:5rem]" />
          <span className="font-display text-lg font-bold tracking-[0.3em] text-primary">J.A.R.V.I.S.</span>
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
