import type { MetadataRoute } from "next";

import { PUBLIC_ROUTES, SITE } from "@/lib/site";

// /sitemap.xml: submit this URL in Google Search Console > Sitemaps.
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE.url}${path === "/" ? "" : path}`,
    changeFrequency,
    priority,
  }));
}
