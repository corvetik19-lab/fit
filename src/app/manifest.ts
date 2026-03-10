import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fit",
    short_name: "fit",
    description:
      "Фитнес-платформа с офлайн-поддержкой для тренировок, питания, статистики и AI-планирования.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f4ee",
    theme_color: "#14614b",
    lang: "ru",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
