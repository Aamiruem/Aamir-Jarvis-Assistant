"use client";

import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

/** Turns on AOS scroll reveals for elements with a data-aos attribute. Renders nothing. */
export function AosInit() {
  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out-cubic", disable: () => matchMedia("(prefers-reduced-motion: reduce)").matches });
  }, []);
  return null;
}
