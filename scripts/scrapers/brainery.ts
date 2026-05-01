/**
 * Brooklyn Brainery scraper.
 * The site is server-rendered Rails — all upcoming courses are listed at /courses
 * with title and date on the listing page itself.
 *
 * HTML structure (per course article):
 *   <h3><a href="/courses/gouache-florals">Gouache Florals</a></h3>
 *   <p class="date"><a href="...">Sat. April 18, 11am</a></p>
 */

import * as cheerio from "cheerio"
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay } from "./utils"

const SOURCE_NAME = "Brooklyn Brainery"
const BASE_URL = "https://brooklynbrainery.com"
const COURSES_URL = `${BASE_URL}/courses`

// ─── Date parser ──────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

/**
 * Parse Brainery date strings like:
 *   "Sat. April 18, 11am"
 *   "Sun. May 4, 2pm"
 *   "Mon. April 20, 7:30pm"
 */
function parseBraineryDate(dateText: string): Date | null {
  const text = dateText.trim()
  // Match: optional day-of-week, month name, day number, time
  const m = text.match(
    /(?:\w{2,3}\.?\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?\s*[,]?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  )
  if (!m) return null

  const month = MONTHS[m[1].toLowerCase()]
  const day = parseInt(m[2])
  const explicitYear = m[3] ? parseInt(m[3]) : null
  let hour = parseInt(m[4])
  const minute = m[5] ? parseInt(m[5]) : 0
  const ampm = m[6].toLowerCase()

  if (ampm === "pm" && hour !== 12) hour += 12
  if (ampm === "am" && hour === 12) hour = 0

  const now = new Date()
  let year = explicitYear ?? now.getFullYear()

  const candidate = new Date(year, month, day, hour, minute, 0, 0)
  // If no explicit year and the date is in the past, push to next year
  if (!explicitYear && candidate < now) year += 1

  return new Date(year, month, day, hour, minute, 0, 0)
}

/**
 * Infer category from course title.
 */
function inferCategory(title: string): string {
  const t = title.toLowerCase()
  if (/(paint|watercolor|gouache|acrylic|oil paint)/i.test(t)) return "painting"
  if (/(draw|sketch|illustrat|figure|life draw|charcoal)/i.test(t)) return "drawing"
  if (/(print|screen print|risograph|linocut|block print)/i.test(t)) return "printmaking"
  if (/(ceramic|clay|pottery)/i.test(t)) return "ceramics"
  if (/(knit|crochet|yarn|sew|stitch|embroider|weav|fiber|macrame)/i.test(t)) return "textiles"
  if (/(photo|darkroom|film|camera)/i.test(t)) return "photography"
  if (/(cook|bak|bread|ferment|food|kombucha|kimchi)/i.test(t)) return "cooking"
  if (/(candle|soap|wax)/i.test(t)) return "candle making"
  if (/(glass|blowing|flamework)/i.test(t)) return "glassblowing"
  if (/(wood|carpentry|furniture)/i.test(t)) return "woodworking"
  if (/(metal|jewelry|silver|ring|earring|solder)/i.test(t)) return "jewelry"
  if (/(floral|flower|plant|botanic)/i.test(t)) return "floral"
  if (/(cocktail|bartend|drink|wine|beer)/i.test(t)) return "drinks"
  if (/(tarot|astrology|meditat|mindful|yoga)/i.test(t)) return "wellness"
  if (/(writing|poetry|novel|storytell|essay)/i.test(t)) return "writing"
  if (/(bird|nature|outdoor)/i.test(t)) return "nature"
  return "workshop"
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

export async function scrapeBrooklynBrainery(): Promise<ScrapedClass[]> {
  console.log(`Scraping Brooklyn Brainery: ${COURSES_URL}`)
  const html = await fetchWithDelay(COURSES_URL)
  const $ = cheerio.load(html)
  const classes: ScrapedClass[] = []
  const now = new Date()

  // Each course is in an article.ga-clickable, or has h3 + p.date siblings
  // Structure: h3 > a[href=/courses/slug] + p.date > a (date text)
  $("h3").each((_, h3) => {
    const $h3 = $(h3)
    const $link = $h3.find("a[href^='/courses/']")
    if (!$link.length) return

    const title = $link.text().trim()
    if (!title || title.length < 3) return

    // The date paragraph is typically a sibling
    const $dateEl = $h3.next("p.date").find("a").first()
    const dateText = $dateEl.text().trim()
    if (!dateText) return

    const startTime = parseBraineryDate(dateText)
    if (!startTime) return
    if (startTime < now) return // Skip past sessions

    const href = $link.attr("href") ?? ""
    const url = href.startsWith("http") ? href : `${BASE_URL}${href}`

    // Duration: Brainery classes are typically 2 hours (no duration on listing page)
    const durationMin = 120
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000)

    // Price: not on listing page — omit and fetch individually if needed
    // For MVP, default to 0 and note in description
    const category = inferCategory(title)

    classes.push({
      sourceName: SOURCE_NAME,
      title,
      description: `Brooklyn Brainery class. Visit ${url} for price and full details.`,
      category,
      startTime,
      endTime,
      durationMin,
      price: 0,
      url,
      externalId: href.replace("/courses/", ""),
      neighborhood: "Prospect Heights",
    })
  })

  console.log(`  → ${classes.length} sessions found`)
  return classes
}

// Run directly: npx tsx scripts/scrapers/brainery.ts
if (process.argv[1]?.endsWith("brainery.ts")) {
  scrapeBrooklynBrainery().then((results) => {
    console.log(`\nTotal sessions: ${results.length}`)
    results.forEach((r) =>
      console.log(`  ${r.title} | ${r.startTime.toLocaleDateString()} | ${r.category}`)
    )
  })
}
