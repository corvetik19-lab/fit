import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fitora",
    short_name: "fitora",
    description: "Тренировки, питание и прогресс в одном ритме.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fbff",
    theme_color: "#2563EB",
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
