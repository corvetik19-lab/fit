import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const sans = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fit-platform.vercel.app"),
  title: {
    default: "fit",
    template: "%s · fit",
  },
  description:
    "Офлайн-ориентированная фитнес-платформа для тренировок, питания, аналитики, админ-панели и AI-планирования.",
  applicationName: "fit",
  appleWebApp: {
    capable: true,
    title: "fit",
    statusBarStyle: "default",
  },
  manifest: "/manifest.webmanifest",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${sans.variable} ${mono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
