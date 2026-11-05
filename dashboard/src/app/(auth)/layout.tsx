import Link from "next/link";

import { AzarvisLogo } from "@/components/azarvis-logo";
import { JarvisOrb } from "@/components/jarvis-orb";

// Route group "(auth)": shares this centered layout without adding "/auth" to the URL.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex flex-col items-center gap-3" aria-label="Azarvis home">
          <JarvisOrb className="[--orb-size:5rem]" />
          <AzarvisLogo markClassName="size-7" />
        </Link>
        <div className="rounded-xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}
