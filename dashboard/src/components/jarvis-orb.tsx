"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import { cn } from "@/lib/utils";

import styles from "./jarvis-orb.module.scss";

gsap.registerPlugin(useGSAP);

/** Animated orb. GSAP drives the timeline; useGSAP cleans it up when the component unmounts. */
export function JarvisOrb({ className, active = false }: { className?: string; active?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(`.${styles.core}`, { scale: 0.4, opacity: 0, duration: 1.1, ease: "back.out(1.7)" });
        gsap.utils.toArray<HTMLElement>(`.${styles.ring}`).forEach((ring, i) => {
          gsap.to(ring, { rotation: i % 2 ? -360 : 360, duration: (active ? 4 : 10) + i * 4, repeat: -1, ease: "none" });
        });
        gsap.to(`.${styles.core}`, {
          scale: active ? 1.12 : 1.05,
          duration: active ? 0.5 : 2.2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });
    },
    { scope: root, dependencies: [active], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={cn(styles.orb, className)} aria-hidden="true">
      <div className={styles.core} />
      <div className={styles.ring} />
      <div className={styles.ring} />
      <div className={styles.ring} />
    </div>
  );
}
