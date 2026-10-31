import type { Metadata, Viewport } from "next";
import { Inter, Rajdhani } from "next/font/google";

import { Providers } from "@/components/providers";
import { themeBootScript } from "@/context/theme-context";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const rajdhani = Rajdhani({ variable: "--font-rajdhani", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Jarvis Dashboard", template: "%s · Jarvis" },
  description: "Your AI assistant's command center: chat, tasks, memories, analytics and weather.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
