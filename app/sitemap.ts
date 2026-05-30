import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/#programas`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/#horarios`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/#promos`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/#contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/portal`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
