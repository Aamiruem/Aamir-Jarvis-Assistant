import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

// The preview card shown when a link to the site is shared (WhatsApp, LinkedIn, X, Slack…).
// Rendered once at build time. Twitter uses it too (see twitter.card in the root layout).
export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          <div style={{ fontSize: 30, letterSpacing: 12, color: "#38e1ff", fontWeight: 700 }}>J.A.R.V.I.S.</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, marginTop: 24 }}>Your AI voice assistant</div>
          <div style={{ fontSize: 32, color: "#8a9bc0", marginTop: 28, lineHeight: 1.35 }}>
            Talk naturally. Jarvis handles reminders, tasks, documents and your PC, hands-free.
          </div>
        </div>
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 300,
            display: "flex",
            background: "radial-gradient(circle at 38% 34%, #a5f3fc 0%, #38e1ff 38%, #6d28d9 100%)",
            boxShadow: "0 0 120px 30px rgba(56, 225, 255, 0.35)",
          }}
        />
      </div>
    ),
    size,
  );
}
