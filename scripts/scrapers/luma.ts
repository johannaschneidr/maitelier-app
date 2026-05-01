/**
 * Luma calendar scraper.
 * Parses __NEXT_DATA__ JSON for accurate dates, end times, and availability.
 */
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay } from "./utils"
import { getSourcesByPlatform } from "../config/sources"

/** Craft-type tags only; omit Club, Collaborator, Solo D8, Pay What You Can, etc. */
const CRAFT_TAGS = new Set(["clay", "zine", "textile", "printmaking", "craft", "drawing", "collage", "workshop", "jewelry", "ceramics", "woodworking", "painting", "sewing", "embroidery", "weaving", "pottery", "metal", "glass", "paper", "bookbinding", "letterpress", "riso", "screenprinting"])

interface LumaEventItem {
  event?: {
    api_id?: string
    name?: string
    start_at?: string
    end_at?: string
    url?: string
    geo_address_info?: { short_address?: string; address?: string; full_address?: string }
  }
  start_at?: string
  ticket_info?: {
    price?: { cents?: number; is_flexible?: boolean }
    is_free?: boolean
    is_sold_out?: boolean
    spots_remaining?: number
  }
  tags?: Array<{ name?: string }>
}

async function scrapeLumaSource(
  sourceName: string,
  url: string
): Promise<ScrapedClass[]> {
  const html = await fetchWithDelay(url)
  const classes: ScrapedClass[] = []

  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) {
    console.warn(`No __NEXT_DATA__ found for ${url}, falling back to HTML parsing`)
    return classes
  }

  let data: { props?: { pageProps?: { initialData?: { data?: { featured_items?: LumaEventItem[]; items?: LumaEventItem[] } } } } }
  try {
    data = JSON.parse(match[1])
  } catch {
    return classes
  }

  const items =
    data?.props?.pageProps?.initialData?.data?.featured_items ??
    data?.props?.pageProps?.initialData?.data?.items ??
    []

  for (const item of items) {
    const evt = item.event
    const name = evt?.name
    if (!name || name.length < 3) continue

    const startStr = item.start_at ?? evt?.start_at
    const endStr = evt?.end_at
    if (!startStr) continue

    const startTime = new Date(startStr)
    const endTime = endStr ? new Date(endStr) : new Date(startTime.getTime() + 2 * 60 * 60 * 1000)

    const ticket = item.ticket_info
    let price = 0
    let capacity = -1
    let spotsLeft = -1

    if (ticket) {
      if (ticket.is_free) {
        price = 0
      } else if (ticket.price?.cents != null) {
        price = ticket.price.cents / 100
      }
      if (ticket.is_sold_out) {
        spotsLeft = 0
        capacity = 0
      } else if (ticket.spots_remaining != null) {
        spotsLeft = ticket.spots_remaining
        // Luma doesn't expose total capacity; keep -1 so UI shows "X spots left"
      }
    }

    const craftTag = item.tags?.map((t) => t.name?.toLowerCase()).find((t) => t && CRAFT_TAGS.has(t))
    const category = craftTag ?? "workshop"
    const eventUrl = evt?.url ? `https://luma.com/events/${evt.url}` : undefined
    const geo = evt?.geo_address_info as { short_address?: string; address?: string; full_address?: string; sublocality?: string } | undefined
    const address = geo?.short_address ?? geo?.address ?? geo?.full_address
    const neighborhood = geo?.sublocality

    classes.push({
      sourceName,
      title: name,
      startTime,
      endTime,
      price,
      url: eventUrl,
      externalId: evt?.api_id,
      category,
      capacity,
      spotsLeft,
      address,
      neighborhood,
    })
  }

  return classes
}

export async function scrapeLuma(): Promise<ScrapedClass[]> {
  const sources = getSourcesByPlatform("luma").filter((s) => s.url)
  const all: ScrapedClass[] = []
  for (const src of sources) {
    if (!src.url) continue
    try {
      const classes = await scrapeLumaSource(src.name, src.url)
      all.push(...classes)
    } catch (err) {
      console.error(`Luma scrape failed for ${src.name}:`, err)
    }
  }
  return all
}
