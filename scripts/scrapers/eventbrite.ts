/**
 * Eventbrite organizer page scraper.
 * Handles all Eventbrite sources from config.
 */
import * as cheerio from "cheerio"
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay, parsePrice } from "./utils"
import { getSourcesByPlatform } from "../config/sources"

function parseEventbriteDate(text: string): { start: Date; end: Date } {
  const fallback = () => {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    start.setHours(10, 0, 0, 0)
    return { start, end: new Date(start.getTime() + 2 * 60 * 60 * 1000) }
  }
  const parsed = new Date(text)
  if (!isNaN(parsed.getTime())) {
    return {
      start: parsed,
      end: new Date(parsed.getTime() + 2 * 60 * 60 * 1000),
    }
  }
  return fallback()
}

async function scrapeEventbriteSource(
  sourceName: string,
  url: string
): Promise<ScrapedClass[]> {
  const html = await fetchWithDelay(url)
  const $ = cheerio.load(html)
  const classes: ScrapedClass[] = []

  // Eventbrite embeds data in script tags or uses predictable structure
  // Try JSON-LD first
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}")
      const items = Array.isArray(json) ? json : json["@graph"] || [json]
      for (const item of items) {
        if (item["@type"] === "Event") {
          const name = item.name || item.title
          if (!name) return
          const startStr = item.startDate || item.start
          const endStr = item.endDate || item.end
          const { start, end } = startStr
            ? {
                start: new Date(startStr),
                end: endStr ? new Date(endStr) : new Date(new Date(startStr).getTime() + 2 * 60 * 60 * 1000),
              }
            : parseEventbriteDate("")
          const price = item.offers?.lowPrice ?? item.offers?.price ?? 0
          const priceNum = typeof price === "number" ? price : parsePrice(String(price))
          classes.push({
            sourceName,
            title: name,
            startTime: start,
            endTime: end,
            price: priceNum,
            url: item.url || item.offers?.url,
            externalId: item["@id"] || item.url,
            category: item.eventAttendanceMode?.includes("Online") ? "online" : undefined,
          })
        }
      }
    } catch {
      // ignore parse errors
    }
  })

  // Fallback: HTML selectors
  if (classes.length === 0) {
    $('[data-testid="event-card"], .event-card, [href*="/e/"]').each((_, el) => {
      const $el = $(el)
      const link = $el.is("a") ? $el : $el.find("a[href*='/e/']").first()
      const href = link.attr("href") || ""
      const eventId = href.match(/\/e\/([^/?]+)/)?.[1]
      const title = $el.find("h2, h3, [data-testid='event-title']").first().text().trim() || link.text().trim()
      if (!title || title.length < 3) return

      const dateEl = $el.find("[data-testid='event-date'], .event-date, time").first()
      const dateText = dateEl.attr("datetime") || dateEl.text()
      const { start, end } = parseEventbriteDate(dateText)

      const priceEl = $el.find("[data-testid='event-price'], .event-price, .price").first()
      const price = parsePrice(priceEl.text())

      const url = href.startsWith("http") ? href : `https://www.eventbrite.com${href}`
      classes.push({
        sourceName,
        title,
        startTime: start,
        endTime: end,
        price,
        url,
        externalId: eventId,
      })
    })
  }

  return classes
}

export async function scrapeEventbrite(): Promise<ScrapedClass[]> {
  const sources = getSourcesByPlatform("eventbrite").filter((s) => s.url)
  const all: ScrapedClass[] = []
  for (const src of sources) {
    if (!src.url) continue
    try {
      const classes = await scrapeEventbriteSource(src.name, src.url)
      all.push(...classes)
    } catch (err) {
      console.error(`Eventbrite scrape failed for ${src.name}:`, err)
    }
  }
  return all
}
