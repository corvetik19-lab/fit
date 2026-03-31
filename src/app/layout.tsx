import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { IBM_Plex_Mono, Manrope, Sora } from "next/font/google";
import "./globals.css";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { resolveSiteUrl } from "@/lib/site-url";

const sans = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: "fit",
    template: "%s · fit",
  },
  description:
    "Фитнес-платформа с офлайн-поддержкой для тренировок, питания, аналитики, админ-панели и AI-планирования.",
  applicationName: "fit",
  appleWebApp: {
    capable: true,
    title: "fit",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f7a60",
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
