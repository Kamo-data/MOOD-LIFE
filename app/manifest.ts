import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mood Life",
    short_name: "Mood Life",
    description:
      "Un mood tracker de couple et d’amis avec historique et partage sécurisé.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff1f7",
    theme_color: "#ec4899",
    orientation: "portrait",
    categories: ["lifestyle", "health"],
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