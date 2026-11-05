import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

// The preview card shown when a link to the site is shared (WhatsApp, LinkedIn, X, Slack…).
// Rendered once at build time. Twitter uses it too (see twitter.card in the root layout).
export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "src/app/icon.svg"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 88px",
          color: "#e3ecff",
          background: "radial-gradient(circle at 78% 40%, #1e1b4b 0%, #0b1020 55%, #050816 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 34, letterSpacing: 14, color: "#38e1ff", fontWeight: 700 }}>AZARVIS</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>Your AI voice assistant</div>
          <div style={{ fontSize: 32, color: "#8a9bc0", marginTop: 28, lineHeight: 1.35 }}>
            Talk naturally. Azarvis handles reminders, tasks, documents and your PC, hands-free.
          </div>
          <div style={{ fontSize: 28, color: "#fde68a", marginTop: 32, fontWeight: 700 }}>{`by ${SITE.author}`}</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> only */}
        <img src={`data:image/svg+xml;base64,${logo.toString("base64")}`} width={300} height={300} alt="" />
      </div>
    ),
    size,
  );
}
