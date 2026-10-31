import { JarvisOrb } from "@/components/jarvis-orb";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the session is being restored. */
export function SessionSplash() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        <JarvisOrb className="[--orb-size:6rem]" active />
        <Skeleton className="h-4 w-40" />
        <span className="sr-only">Checking your session…</span>
      </div>
    </div>
  );
}
