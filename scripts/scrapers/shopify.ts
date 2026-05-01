/**
 * Shopify scraper — uses the public /products.json API endpoint.
 * Every Shopify store exposes this at {store}/products.json?limit=250.
 *
 * Date extraction: workshop products encode the session date in their title,
 * e.g. "Cake Decorating Class - 3 Jun 2026" or "Junk Journaling (APR 25)".
 * We parse dates from the title and fall back to body_html if needed.
 */

import type { ScrapedClass } from "../../types/scraped"
import { getSourcesByPlatform } from "../config/sources"
import { parsePrice, parseDurationToMinutes } from "./utils"

// ─── Shopify types ────────────────────────────────────────────────────────────

interface ShopifyVariant {
  price: string
  available: boolean
  title: string
}

interface ShopifyImage {
  src: string
}

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string
  vendor: string
  tags: string[]
  variants: ShopifyVariant[]
  images: ShopifyImage[]
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[]
}

// ─── Month lookup ─────────────────────────────────────────────────────────────

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

// ─── Date / time parser ───────────────────────────────────────────────────────

interface ParsedDateTime {
  startTime: Date
  endTime: Date
  cleanTitle: string
}

/**
 * Parse date and time from a Shopify workshop product title.
 * Handles formats like:
 *   "Succulent Cake Class - 3 Jun 2026"
 *   "Cake Decorating | June 3rd | 11:00 AM - 1:30 PM - 3 Jun 2026"
 *   "Junk Journaling (APR 25)"
 *   "Incense Workshop & Teach-In"  (no date — returns null)
 */
function parseTitleDate(title: string): ParsedDateTime | null {
  const now = new Date()
  let remaining = title

  // Pattern A: "3 Jun 2026" or "3 June 2026" (most explicit — try first)
  const pA = /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\w*\s+(\d{4})\b/i
  // Pattern B: "June 3rd" or "June 3rd, 2026" (named month first)
  const pB = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\w*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?/i
  // Pattern C: "(APR 25)" abbreviated month in parens
  const pC = /\(\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+(\d{1,2})\s*\)/i
  // Time pattern: "11:00 AM - 1:30 PM"
  const pTime = /\b(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)/i

  let day: number | null = null
  let month: number | null = null
  let year: number = now.getFullYear()
  let hasExplicitYear = false

  const mA = title.match(pA)
  const mB = !mA ? title.match(pB) : null
  const mC = !mA && !mB ? title.match(pC) : null

  if (mA) {
    day = parseInt(mA[1])
    month = MONTH_INDEX[mA[2].toLowerCase().slice(0, 3)]
    year = parseInt(mA[3])
    hasExplicitYear = true
    remaining = remaining.replace(mA[0], " ").trim()
  } else if (mB) {
    month = MONTH_INDEX[mB[1].toLowerCase().slice(0, 3)]
    day = parseInt(mB[2])
    if (mB[3]) { year = parseInt(mB[3]); hasExplicitYear = true }
    remaining = remaining.replace(mB[0], " ").trim()
  } else if (mC) {
    month = MONTH_INDEX[mC[1].toLowerCase()]
    day = parseInt(mC[2])
    remaining = remaining.replace(mC[0], " ").trim()
  }

  if (day === null || month === null) return null

  // Infer year: if no explicit year and the date is in the past, try next year
  if (!hasExplicitYear) {
    const candidate = new Date(year, month, day)
    if (candidate < now) year += 1
  }

  // Default start time: 10am
  let startHour = 10, startMin = 0, endHour = 12, endMin = 0
  let hasTime = false

  const mTime = remaining.match(pTime) ?? title.match(pTime)
  if (mTime) {
    const parseHHMM = (s: string): [number, number] => {
      const clean = s.replace(/\s+/g, "")
      const isPM = /PM/i.test(clean)
      const isAM = /AM/i.test(clean)
      const [h, m] = clean.replace(/[AP]M/i, "").split(":").map(Number)
      const hours = isPM && h !== 12 ? h + 12 : isAM && h === 12 ? 0 : h
      return [hours, m]
    }
    ;[startHour, startMin] = parseHHMM(mTime[1])
    ;[endHour, endMin] = parseHHMM(mTime[2])
    hasTime = true
    remaining = remaining.replace(mTime[0], " ").trim()
  }

  const startTime = new Date(year, month, day, startHour, startMin, 0, 0)
  const endTime = new Date(year, month, day, endHour, endMin, 0, 0)

  // If end <= start (e.g. time parsing edge case), default to 2 hour duration
  if (!hasTime || endTime <= startTime) {
    endTime.setTime(startTime.getTime() + 2 * 60 * 60 * 1000)
  }

  // Clean up title: remove separators and empty parens left over
  const cleanTitle = remaining
    .replace(/\(\s*\)/g, "")         // Remove empty parens "()"
    .replace(/\s*[-–|]\s*$/, "")     // Trailing separator
    .replace(/^\s*[-–|]\s*/, "")     // Leading separator
    .replace(/\s{2,}/g, " ")
    .trim()

  return { startTime, endTime, cleanTitle: cleanTitle || title }
}

/**
 * Strip HTML tags from body_html and search for a date there.
 * Used as fallback when the title has no date.
 */
function parseDateFromHtml(bodyHtml: string): ParsedDateTime | null {
  const text = bodyHtml.replace(/<[^>]+>/g, " ").replace(/&\w+;/g, " ")
  return parseTitleDate(text)
}

/**
 * Guess whether a Shopify product is a workshop/class (not a physical item).
 */
function isWorkshopProduct(product: ShopifyProduct): boolean {
  const t = product.title.toLowerCase()
  const hasWorkshopKeyword = /(workshop|class|lesson|session|course|event|tutorial|club)/i.test(t)
  const hasDateInTitle = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(product.title)
  const isPhysical = /(sticker|mug|tote|bag|print|poster|pin|zine|book|tshirt|shirt|hoodie|hat|cap)\b/i.test(t)
  return (hasWorkshopKeyword || hasDateInTitle) && !isPhysical
}

/**
 * Infer a craft category from product title and description.
 */
function inferCategory(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase()
  if (/(cake|bak|pastry|cook|bread|sugar|decorat)/i.test(text)) return "baking"
  if (/(ceramic|clay|pottery|wheel)/i.test(text)) return "ceramics"
  if (/(knit|crochet|yarn|sew|stitch|embroider|weav|fiber|textile)/i.test(text)) return "textiles"
  if (/(paint|watercolor|gouache|acrylic|oil paint)/i.test(text)) return "painting"
  if (/(draw|sketch|illustrat|figure|life draw)/i.test(text)) return "drawing"
  if (/(print|screen print|risograph|linocut|letterpress)/i.test(text)) return "printmaking"
  if (/(candle|wax|soap|pour)/i.test(text)) return "candle making"
  if (/(glass|blowing|flamework|neon|stained)/i.test(text)) return "glassblowing"
  if (/(wood|carpentry|joinery|furniture)/i.test(text)) return "woodworking"
  if (/(metal|jewelry|silver|gold|solder|ring|earring)/i.test(text)) return "jewelry"
  if (/(photo|darkroom|film|camera)/i.test(text)) return "photography"
  if (/(floral|flower|botanic|plant)/i.test(text)) return "floral"
  if (/(macrame|basket|weav)/i.test(text)) return "fiber arts"
  if (/(cocktail|bartend|drink|mixology)/i.test(text)) return "mixology"
  if (/(incense|candle|aromatherapy)/i.test(text)) return "aromatherapy"
  return "workshop"
}

// ─── Core scraper ─────────────────────────────────────────────────────────────

async function scrapeShopifyStore(
  sourceName: string,
  storeUrl: string
): Promise<ScrapedClass[]> {
  const base = storeUrl.replace(/\/$/, "")
  const apiUrl = `${base}/products.json?limit=250`

  const res = await fetch(apiUrl, {
    headers: { "User-Agent": "CraftPass/1.0 (craftpass.app)" },
  })
  if (!res.ok) throw new Error(`${res.status} fetching ${apiUrl}`)

  const data: ShopifyProductsResponse = await res.json()
  const classes: ScrapedClass[] = []

  for (const product of data.products) {
    if (!isWorkshopProduct(product)) continue

    const price = parseFloat(product.variants[0]?.price ?? "0") || 0
    const available = product.variants.some((v) => v.available)
    if (!available) continue

    const description = product.body_html
      ? product.body_html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 500)
      : ""

    // Try to get duration from description
    const durationMin = parseDurationToMinutes(description) ?? undefined

    // Parse date: title first, then body_html
    const parsed = parseTitleDate(product.title) ?? parseDateFromHtml(product.body_html)
    if (!parsed) continue // No date found — skip

    const { startTime, endTime, cleanTitle } = parsed

    // Skip past events
    if (startTime < new Date()) continue

    const productUrl = `${base}/products/${product.handle}`
    const category = inferCategory(cleanTitle, description)

    // Cap title at 100 chars — some stores embed descriptions in product titles
    const finalTitle = cleanTitle.length > 100 ? cleanTitle.slice(0, 97) + "…" : cleanTitle

    classes.push({
      sourceName,
      title: finalTitle,
      description,
      category,
      startTime,
      endTime,
      durationMin,
      price,
      url: productUrl,
      externalId: String(product.id),
    })
  }

  return classes
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function scrapeShopify(): Promise<ScrapedClass[]> {
  const sources = getSourcesByPlatform("shopify").filter(
    (s) => s.scrapeEnabled && s.url
  )
  const all: ScrapedClass[] = []

  for (const src of sources) {
    if (!src.url) continue
    try {
      console.log(`Scraping Shopify: ${src.name}`)
      const classes = await scrapeShopifyStore(src.name, src.url)
      console.log(`  → ${classes.length} sessions found`)
      all.push(...classes)
    } catch (err) {
      console.error(`  ✗ Failed: ${String(err)}`)
    }
  }

  return all
}

// Run directly: npx tsx scripts/scrapers/shopify.ts
if (process.argv[1]?.endsWith("shopify.ts")) {
  scrapeShopify().then((results) => {
    console.log(`\nTotal sessions: ${results.length}`)
    results.forEach((r) =>
      console.log(
        `  ${r.sourceName} | ${r.title} | ${r.startTime.toLocaleDateString()} | $${r.price}`
      )
    )
  })
}
