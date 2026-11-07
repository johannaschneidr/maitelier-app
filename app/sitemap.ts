import type { MetadataRoute } from "next"
import { getCatalog } from "@/lib/catalog"
import { CRAFTS } from "@/lib/taxonomy/crafts"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://maitelier.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog()

  const studioUrls: MetadataRoute.Sitemap = [...catalog.studioBySlug.values()].map((v) => ({
    url: `${SITE_URL}/studios/${v.studio.slug}`,
    lastModified: v.lastCheckedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const classUrls: MetadataRoute.Sitemap = catalog.classes.map((c) => ({
    url: `${SITE_URL}/classes/${c.slug}`,
    lastModified: c.lastCheckedAt ?? new Date(),
    changeFrequency: "daily",
    priority: c.sessions.length > 0 ? 0.8 : 0.5,
  }))

  const liveCrafts = new Set(catalog.classes.filter((c) => c.sessions.length > 0).map((c) => c.craft))
  const craftUrls: MetadataRoute.Sitemap = CRAFTS.filter((c) => liveCrafts.has(c.slug)).map((c) => ({
    url: `${SITE_URL}/crafts/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/studios`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/crafts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...craftUrls,
    ...studioUrls,
    ...classUrls,
  ]
}
