import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { IBM_Plex_Mono, Lexend, Manrope } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { resolveSiteUrl } from "@/lib/site-url";

import "./globals.css";

const sans = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const display = Lexend({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: "fit",
    template: "%s · fit",
  },
  description:
    "Фитнес-платформа с PWA-подачей для тренировок, питания, AI-коучинга, аналитики и операторской панели.",
  applicationName: "fit",
  appleWebApp: {
    capable: true,
    title: "fit",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0040e0",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isVercelRuntime = process.env.VERCEL === "1";

  return (
    <html lang="ru">
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        {children}
        {isVercelRuntime ? <Analytics /> : null}
        {isVercelRuntime ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
