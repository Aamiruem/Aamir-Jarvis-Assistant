import { useId } from "react";

import { cn } from "@/lib/utils";

// The Azarvis mark: an "A" whose crossbar is a voice wave, with a spark where it wakes up.
// Same drawing as src/app/icon.svg; inline so it needs no request and stays sharp at any size.
export function AzarvisMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1f4d" />
          <stop offset="1" stopColor="#070a1a" />
        </linearGradient>
        <linearGradient id={`${id}a`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset=".55" stopColor="#818cf8" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
        <radialGradient id={`${id}s`}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".35" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}t)`} />
      <path d="M14.5 51 L32 14 L49.5 51" fill="none" stroke={`url(#${id}a)`} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19.5 39 H24 L27 33.5 L30.5 44.5 L34 30.5 L37.5 42 L40.5 36.5 L42.5 39 H44.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="14" r="7" fill={`url(#${id}s)`} />
    </svg>
  );
}

/** Mark + "AZARVIS" wordmark, for headers. */
export function AzarvisLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AzarvisMark className={markClassName} />
      <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text font-display text-lg font-bold tracking-[0.2em] text-transparent sm:text-xl">
        AZARVIS
      </span>
    </span>
  );
}
