/**
 * ResoBox scraper — Japanese arts workshop studio, East Village.
 * Uses WordPress The Events Calendar plugin, server-rendered.
 *
 * Listing page: /events/ (paginated, up to 3 pages)
 * HTML: article.tribe_events → title, datetime, end time all on listing page.
 * Price: fetched from individual event pages (not on listing).
 */

import * as cheerio from "cheerio"
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay } from "./utils"

const SOURCE_NAME = "ResoBox"
const BASE_URL = "https://resobox.com"
const MAX_PAGES = 3

// ─── Date / time parsers ──────────────────────────────────────────────────────

function parseTime12(str: string): [number, number] {
  const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  if (!m) return [12, 0]
  let h = parseInt(m[1])
  const min = m[2] ? parseInt(m[2]) : 0
  const period = m[3].toLowerCase()
  if (period === "pm" && h !== 12) h += 12
  if (period === "am" && h === 12) h = 0
  return [h, min]
}

/**
 * Build start/end Date from:
 *   isoDate  = "2026-04-22"  (from <time datetime="...">)
 *   startText = "April 22 @ 6:00 pm"
 *   endText   = "7:00 pm"
 */
function parseDates(
  isoDate: string,
  startText: string,
  endText: string
): { startTime: Date; endTime: Date } | null {
  const dm = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dm) return null
  const year = parseInt(dm[1])
  const month = parseInt(dm[2]) - 1
  const day = parseInt(dm[3])

  const afterAt = startText.match(/@\s*(.+)/)
  const [sh, sm] = afterAt ? parseTime12(afterAt[1]) : [12, 0]
  const [eh, em] = parseTime12(endText)

  const startTime = new Date(year, month, day, sh, sm)
  let endTime = new Date(year, month, day, eh, em)
  if (endTime <= startTime) endTime = new Date(startTime.getTime() + 90 * 60_000)

  return { startTime, endTime }
}

// ─── Price from detail page ───────────────────────────────────────────────────

async function fetchPrice(url: string): Promise<number> {
  try {
    const html = await fetchWithDelay(url, 1000)
    const $ = cheerio.load(html)
    const text = $(".tribe-events-content, .tribe-events-single-event-description, article")
      .first()
      .text()
    const matches = [...text.matchAll(/\$\s*(\d+(?:\.\d{2})?)/g)]
    const prices = matches
      .map((m) => parseFloat(m[1]))
      .filter((p) => p >= 10 && p < 800)
    return prices.length > 0 ? Math.max(...prices) : 0
  } catch {
    return 0
  }
}

// ─── Category ─────────────────────────────────────────────────────────────────

function inferCategory(title: string): string {
  const t = title.toLowerCase()
  if (/(sumi-?e|ink paint|ink art|brush paint)/i.test(t)) return "painting"
  if (/(suminagashi|marbl)/i.test(t)) return "printmaking"
  if (/(calligraph)/i.test(t)) return "drawing"
  if (/(chanoyu|tea ceremony|matcha|ocha)/i.test(t)) return "wellness"
  if (/(ikebana|flower arrang)/i.test(t)) return "floral"
  if (/(ceramic|pottery|clay)/i.test(t)) return "ceramics"
  if (/(origami)/i.test(t)) return "workshop"
  if (/(bonsai)/i.test(t)) return "workshop"
  if (/(paint|watercolor)/i.test(t)) return "painting"
  if (/(draw|sketch)/i.test(t)) return "drawing"
  return "workshop"
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

export async function scrapeResoBox(): Promise<ScrapedClass[]> {
  const classes: ScrapedClass[] = []
  const now = new Date()

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url =
      page === 1
        ? `${BASE_URL}/events/`
        : `${BASE_URL}/events/page/${page}/`

    console.log(`  Fetching page ${page}: ${url}`)

    let html: string
    try {
      html = await fetchWithDelay(url, 1500)
    } catch {
      break
    }

    const $ = cheerio.load(html)
    const articles = $("article.tribe_events")
    if (articles.length === 0) break

    const pageItems: { cls: ScrapedClass; needsPrice: boolean }[] = []

    for (const el of articles.toArray()) {
      const $el = $(el)

      const titleLink = $el.find(".tribe-events-calendar-list__event-title-link")
      const title = titleLink.text().trim()
      const href = titleLink.attr("href") ?? ""
      if (!title || !href) continue

      const $time = $el.find("time.tribe-events-calendar-list__event-datetime")
      const isoDate = $time.attr("datetime") ?? ""
      const startText = $el.find("span.tribe-event-date-start").text().trim()
      const endText = $el.find("span.tribe-event-time").text().trim()

      const dates = parseDates(isoDate, startText, endText)
      if (!dates) continue
      if (dates.startTime < now) continue

      const description =
        $el.find(".tribe-events-calendar-list__event-description p").text().trim().slice(0, 500)

      const durationMin = Math.round(
        (dates.endTime.getTime() - dates.startTime.getTime()) / 60_000
      )

      const cls: ScrapedClass = {
        sourceName: SOURCE_NAME,
        title,
        description: description || `ResoBox workshop. Visit ${href} for details.`,
        category: inferCategory(title),
        startTime: dates.startTime,
        endTime: dates.endTime,
        durationMin,
        price: 0,
        url: href,
        externalId: `${href.split("/event/")[1]?.replace(/\//g, "") ?? title}-${isoDate}`,
        neighborhood: "East Village",
      }

      pageItems.push({ cls, needsPrice: true })
    }

    // Fetch prices sequentially (respect rate limit)
    for (const { cls, needsPrice } of pageItems) {
      if (needsPrice && cls.url) {
        cls.price = await fetchPrice(cls.url)
      }
      classes.push(cls)
    }
  }

  console.log(`  → ${classes.length} sessions found`)
  return classes
}

// Run directly: npx tsx scripts/scrapers/resobox.ts
if (process.argv[1]?.endsWith("resobox.ts")) {
  scrapeResoBox().then((results) => {
    console.log(`\nTotal sessions: ${results.length}`)
    results.forEach((r) =>
      console.log(
        `  ${r.title} | ${r.startTime.toLocaleDateString()} | $${r.price}`
      )
    )
  })
}
