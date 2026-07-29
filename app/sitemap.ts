import type { MetadataRoute } from "next";
import { getAll, LIFESTYLE_HUBS } from "@/lib/communities";
import { getArticles } from "@/lib/journal";

/**
 * Sitemap is generated from the SAME sources app/[slug] uses in
 * generateStaticParams (communities.json + LIFESTYLE_HUBS) plus the journal,
 * so it can never drift out of sync with what the site actually serves.
 *
 * Deliberately excluded: /listing/* — those are ~19k churning MLS detail pages
 * keyed on bare MLS ids. They stay crawlable but out of the sitemap; the
 * community and lifestyle pages are the indexable surface.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.livemodern.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${SITE_URL}${path}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/new-construction"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/collections"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/featured-buildings"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/journal"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: url("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Lifestyle hubs (/boating, /waterfront, /beach, …)
  const hubs: MetadataRoute.Sitemap = LIFESTYLE_HUBS.map((h) => ({
    url: url(`/${h.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Every community: buildings, city hubs, and lifestyle spokes all live in
  // communities.json and are served by app/[slug].
  const seen = new Set(LIFESTYLE_HUBS.map((h) => h.slug));
  const communities: MetadataRoute.Sitemap = getAll()
    .filter((c) => !seen.has(c.slug))
    .map((c) => ({
      url: url(`/${c.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: c.type === "collection" ? 0.8 : 0.7,
    }));

  const journal: MetadataRoute.Sitemap = getArticles().map((a) => ({
    url: url(`/journal/${a.slug}`),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...hubs, ...communities, ...journal];
}
