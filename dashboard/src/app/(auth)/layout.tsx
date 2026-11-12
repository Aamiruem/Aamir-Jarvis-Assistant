import { Mic, Search } from "lucide-react";
import Link from "next/link";

import { AzarvisLogo } from "@/components/azarvis-logo";
import { JarvisOrb } from "@/components/jarvis-orb";
import { SiteFooter } from "@/components/site-footer";

// Route group "(auth)": shares this centered layout without adding "/auth" to the URL.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f7fb] px-4 py-8">
      <div className="w-full max-w-[760px] rounded-[2rem] border border-slate-200/80 bg-[#f4f5f7] p-6 shadow-[0_20px_60px_rgba(108,140,180,0.12)] sm:p-8">
        <div className="flex flex-col items-center justify-center gap-5">
          <Link href="/" className="flex flex-col items-center gap-3" aria-label="Azarvis home">
            <JarvisOrb className="[--orb-size:18rem] sm:[--orb-size:20rem]" />
            <AzarvisLogo className="mt-2" markClassName="size-8" />
          </Link>

          <button
            type="button"
            className="inline-flex w-full max-w-[480px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1d6db0] via-[#2f7fc2] to-[#6956d7] px-5 py-4 text-lg font-semibold text-white shadow-[0_16px_30px_rgba(55,103,200,0.28)] transition hover:brightness-110"
          >
            <Mic className="size-5" aria-hidden="true" />
            Talk to Azarvis
          </button>

          <p className="text-center text-lg text-slate-500">Talk naturally. Interrupt any time, or say “stop” to finish.</p>

          <div className="flex w-full max-w-[560px] items-center gap-3 rounded-full border border-slate-200 bg-white/85 px-3 py-2 shadow-sm">
            <Search className="size-4 text-slate-500" aria-hidden="true" />
            <input
              aria-label="Ask Azarvis"
              placeholder="Ask or tell Azarvis..."
              readOnly
              className="flex-1 bg-transparent text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-[#2f7fc2] to-[#4e64d9] px-5 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Ask
            </button>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white/50 p-4 shadow-sm sm:p-6">{children}</div>
      </div>
      <div className="mx-auto mt-8 w-full max-w-[1840px]">
        <SiteFooter />
      </div>
    </main>
  );
}
