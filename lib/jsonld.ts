/**
 * schema.org builders, generated from the same records as the visible text so
 * the two never disagree.
 */
import type { ClassView, SessionView, Studio } from "@/lib/catalog"

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://maitelier.com"

/** Serialize for a <script type="application/ld+json"> without letting scraped text close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function postalAddress(studio: Studio) {
  const parts = studio.address?.split(",").map((p) => p.trim()) ?? []
  return {
    "@type": "PostalAddress",
    ...(parts[0] && { streetAddress: parts[0] }),
    addressLocality: parts[1] ?? studio.neighborhood ?? "New York",
    addressRegion: "NY",
    addressCountry: "US",
  }
}

function availability(s: SessionView): string {
  if (s.spotsLeft === 0) return "https://schema.org/SoldOut"
  if (s.capacity > 0 && s.spotsLeft > 0 && s.spotsLeft < 4) return "https://schema.org/LimitedAvailability"
  return "https://schema.org/InStock"
}

export function classUrl(c: ClassView): string {
  return `${SITE_URL}/classes/${c.slug}`
}

export function sessionEvent(c: ClassView, s: SessionView) {
  const url = classUrl(c)
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: c.title,
    ...(c.description && { description: c.description }),
    url,
    startDate: s.start.toISOString(),
    endDate: s.end.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: c.studio.name,
      address: postalAddress(c.studio),
      ...(c.studio.coordinates && {
        geo: { "@type": "GeoCoordinates", latitude: c.studio.coordinates.lat, longitude: c.studio.coordinates.lng },
      }),
    },
    organizer: {
      "@type": "Organization",
      name: c.studio.name,
      url: c.studio.website ?? `${SITE_URL}/studios/${c.studio.slug}`,
    },
    offers: {
      "@type": "Offer",
      ...(c.price > 0 && { price: c.price, priceCurrency: "USD" }),
      availability: availability(s),
      url,
    },
  }
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

/** CollectionPage + ItemList of the next sessions (capped so the page stays light). */
export function collectionPage(name: string, path: string, classes: ClassView[], cap = 30) {
  const events = classes
    .flatMap((c) => c.sessions.map((s) => ({ c, s })))
    .sort((a, b) => a.s.start.getTime() - b.s.start.getTime())
    .slice(0, cap)
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${SITE_URL}${path}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: events.map(({ c, s }, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: sessionEvent(c, s),
      })),
    },
  }
}
