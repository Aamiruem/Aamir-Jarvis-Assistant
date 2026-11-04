import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site";

// /manifest.webmanifest: lets browsers install Jarvis like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
