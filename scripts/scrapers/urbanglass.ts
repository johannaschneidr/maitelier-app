/**
 * UrbanGlass scraper — glassblowing studio, Fort Greene Brooklyn.
 * Custom server-rendered site.
 *
 * Listing page: /classes
 * HTML per item:
 *   <li>
 *     <div class="col-xs-10">
 *       <span class="instructor-name"><a href="/classes/detail/[slug]">Title</a></span>
 *       <br/>
 *       [session info: "1 Session: May 2nd" | "3 Sessions: May 15 — May 17"]
 *       <br />
 *       [day + time: "Saturday, 2:00 pm – 5:00 pm"]
 *     </div>
 *   </li>
 *
 * Price: not available in static HTML (JS-rendered) — stored as 0, booking URL provided.
 * Multi-session classes (e.g. "3 Sessions: May 15–17") are included as a single
 * bookable item; startTime = first session date.
 */

import * as cheerio from "cheerio"
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay } from "./utils"

const SOURCE_NAME = "UrbanGlass"
const BASE_URL = "https://urbanglass.org"
const CLASSES_URL = `${BASE_URL}/classes`

// ─── Parsers ──────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7,
  sep: 8, oct: 9, nov: 10, dec: 11,
}

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
 * Extract the first date from session text.
 * Handles: "May 2nd", "May 15 — May 17", "June 20-21"
 */
function parseFirstDate(text: string): { month: number; day: number } | null {
  const m = text.match(/([A-Za-z]+)\s+(\d{1,2})/)
  if (!m) return null
  const month = MONTH_MAP[m[1].toLowerCase()]
  if (month === undefined) return null
  return { month, day: parseInt(m[2]) }
}

// UrbanGlass detail pages are JavaScript-rendered — prices are not in static HTML.
// Price is always set to 0; users are directed to the booking URL to see pricing.

// ─── Category ─────────────────────────────────────────────────────────────────

function inferCategory(title: string): string {
  const t = title.toLowerCase()
  if (/(glass|blowing|flamework|fusing|casting|neon|lampwork|marble|torch|hot shop)/i.test(t))
    return "glassblowing"
  if (/(paint|watercolor)/i.test(t)) return "painting"
  if (/(draw|sketch)/i.test(t)) return "drawing"
  if (/(ceramic|clay|pottery)/i.test(t)) return "ceramics"
  return "glassblowing" // UrbanGlass default
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

export async function scrapeUrbanGlass(): Promise<ScrapedClass[]> {
  console.log(`Scraping UrbanGlass: ${CLASSES_URL}`)
  const html = await fetchWithDelay(CLASSES_URL)
  const $ = cheerio.load(html)
  const now = new Date()

  // Collect listings first, then fetch prices
  const listings: Array<{
    title: string
    url: string
    slug: string
    sessionText: string
    timeText: string
  }> = []

  const seenSlugs = new Set<string>()

  $("li").each((_, el) => {
    const $col = $(el).find(".col-xs-10")
    if (!$col.length) return

    const $link = $col.find("span.instructor-name a")
    if (!$link.length) return

    const rawTitle = $link.text()
      .trim()
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, "")
    if (!rawTitle || rawTitle.length < 3) return

    // Skip youth / school camp programs
    if (/(?:middle|high)\s+school\s+camp/i.test(rawTitle)) return

    const relHref = $link.attr("href") ?? ""
    if (!relHref) return

    const slug = relHref.replace("/classes/detail/", "").replace(/\//g, "")

    // Deduplicate — same class appears in multiple category sections on the page
    if (seenSlugs.has(slug)) return
    seenSlugs.add(slug)

    // Get text nodes after the <span>, split on <br>
    const colHtml = $col.html() ?? ""
    const afterSpan = colHtml.replace(/<span[^>]*>[\s\S]*?<\/span>/i, "")
    const parts = afterSpan
      .split(/<br\s*\/?>/i)
      .map((s) => s.replace(/<[^>]+>/g, "").replace(/&ndash;/g, "–").replace(/&amp;/g, "&").trim())
      .filter(Boolean)

    if (parts.length < 2) return

    const sessionText = parts[0] // "1 Session: May 2nd" | "3 Sessions: May 15 — May 17"
    const timeText = parts[1]   // "Saturday, 2:00 pm – 5:00 pm"

    const url = relHref.startsWith("http") ? relHref : `${BASE_URL}${relHref}`
    const title = rawTitle.replace(/\s*\(free[^)]*\)\s*/gi, "").trim() || rawTitle

    listings.push({ title, url, slug, sessionText, timeText })
  })

  const classes: ScrapedClass[] = []

  for (const { title, url, slug, sessionText, timeText } of listings) {
    const firstDate = parseFirstDate(sessionText)
    if (!firstDate) continue

    // Resolve year — roll to next year if date already passed
    let year = now.getFullYear()
    const candidate = new Date(year, firstDate.month, firstDate.day)
    if (candidate < now) year++

    // Parse start and end time from timeText
    // e.g. "Saturday, 2:00 pm – 5:00 pm" → [2:00pm, 5:00pm]
    const timeMatches = [...timeText.matchAll(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi)]
    if (timeMatches.length < 1) continue

    const [startH, startM] = parseTime12(timeMatches[0][0])
    const [endH, endM] =
      timeMatches.length > 1
        ? parseTime12(timeMatches[timeMatches.length - 1][0])
        : [startH + 2, startM]

    const startTime = new Date(year, firstDate.month, firstDate.day, startH, startM)
    let endTime = new Date(year, firstDate.month, firstDate.day, endH, endM)
    if (endTime <= startTime) endTime = new Date(startTime.getTime() + 2 * 3_600_000)

    if (startTime < now) continue

    const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60_000)

    classes.push({
      sourceName: SOURCE_NAME,
      title,
      description: `${sessionText}. Visit ${url} for registration and full details.`,
      category: inferCategory(title),
      startTime,
      endTime,
      durationMin,
      price: 0,
      url,
      externalId: slug,
      neighborhood: "Fort Greene",
    })
  }

  console.log(`  → ${classes.length} sessions found`)
  return classes
}

// Run directly: npx tsx scripts/scrapers/urbanglass.ts
if (process.argv[1]?.endsWith("urbanglass.ts")) {
  scrapeUrbanGlass().then((results) => {
    console.log(`\nTotal sessions: ${results.length}`)
    results.forEach((r) =>
      console.log(
        `  ${r.title} | ${r.startTime.toLocaleDateString()} | $${r.price} | ${r.category}`
      )
    )
  })
}
