/**
 * Normalized shape for scraped or API-fetched class/workshop data.
 * Scrapers and API adapters output this; the importer maps it to Firebase.
 */
export type ScrapedClass = {
  /** Source name (e.g. "Brooklyn Brainery") - used to match/lookup Source in DB */
  sourceName: string
  /** Class/workshop title */
  title: string
  /** Session start time */
  startTime: Date
  /** Session end time (or derive from startTime + durationMin if unknown) */
  endTime: Date
  /** Price in dollars; 0 if free or unknown */
  price: number
  /** Duration in minutes; optional if endTime is set */
  durationMin?: number
  /** Instructor name if known */
  instructor?: string
  /** Category (ceramics, woodworking, etc.) - maps to template.category */
  category?: string
  /** Description if available */
  description?: string
  /** URL to the class page (for linking back) */
  url?: string
  /** Capacity if known; -1 = unknown (show "Check page for availability") */
  capacity?: number
  /** Spots left if known; -1 = unknown */
  spotsLeft?: number
  /** Raw ID from source (for deduplication / upsert) */
  externalId?: string
  /** Venue address (e.g. "20 Grand Ave, Brooklyn") */
  address?: string
  /** Neighborhood (e.g. "Clinton Hill") for Source */
  neighborhood?: string
}

/** Source config: where to fetch data and how */
export type SourceConfig = {
  name: string
  slug: string
  url: string | null
  /** "scraper" = HTML scraping, "api" = use API adapter if available */
  type: "scraper" | "api"
  /** Platform used for booking / what scraper to use */
  platform?: "eventbrite" | "shopify" | "meetup" | "luma" | "custom" | "fareharbor" | "acuity" | "sawyer" | "squarespace" | "square" | "activecampaigns"
  neighborhood?: string
  address?: string
  instagramHandle?: string
  /** Direct URL to booking/schedule page (may differ from main url) */
  bookingUrl?: string
  /** Query string used for Google Places API text search */
  placeSearchQuery: string
  /** Whether a working scraper exists for this studio */
  scrapeEnabled: boolean
  /** Short editorial description for SEO and display */
  description?: string
}
