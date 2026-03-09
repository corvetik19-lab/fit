import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fit",
    short_name: "fit",
    description:
      "Offline-first fitness platform for workouts, nutrition, analytics, and AI-guided planning.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f5f4ee",
    theme_color: "#14614b",
    lang: "ru",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
