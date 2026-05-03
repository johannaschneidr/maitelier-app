import type { MetadataRoute } from "next"
import { getSources } from "@/lib/queries"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://maitelier.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sources = await getSources()

  const studioUrls: MetadataRoute.Sitemap = sources
    .filter((s) => s.slug)
    .map((s) => ({
      url: `${SITE_URL}/studios/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
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
    ...studioUrls,
  ]
}
