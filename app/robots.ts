import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El panel admin y el portal privado no deben indexarse.
      disallow: ["/admin", "/portal"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
