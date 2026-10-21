import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TapMesa — Painel Operacional",
    short_name: "TapMesa",
    description: "SaaS de chamada de garçom e pedido de conta via QR Code",
    start_url: "/panel",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#ea580c",
    orientation: "any",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
