import Link from "next/link";

import { JarvisOrb } from "@/components/jarvis-orb";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <JarvisOrb className="[--orb-size:7rem]" />
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">Even Azarvis couldn&apos;t find that one.</p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
