import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Force Extreme",
    short_name: "Force Extreme",
    description:
      "Gimnasio en Costa Rica. Clases de Fuerza, HIIT, Funcional e Iniciación.",
    start_url: "/",
    display: "standalone",
    background_color: "#07090d",
    theme_color: "#07090d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
