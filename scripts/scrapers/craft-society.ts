/**
 * Craft Society scraper — folk/heritage craft studio, Park Slope Brooklyn.
 * Wix-powered site; event content is JS-rendered so requires Playwright.
 *
 * Listing page: /event-list — li elements each linking to an event detail page.
 * Detail page: /event-details/{slug} — full date/time, price, description.
 */

import type { ScrapedClass } from "../../types/scraped"
import { withBrowser, delay } from "./playwright-utils"
import { parsePrice } from "./utils"

const SOURCE_NAME = "Craft Society"
const BASE_URL = "https://www.craft-society.com"
const EVENTS_URL = `${BASE_URL}/event-list`

function inferCategory(title: string): string {
  if (/(knit|yarn|fiber|weav|macram|embroider|textile|stitch)/i.test(title)) return "textile"
  if (/(lino|block print|screen print|print)/i.test(title)) return "printmaking"
  if (/(ceramic|pottery|clay)/i.test(title)) return "ceramics"
  if (/(paint|watercolor)/i.test(title)) return "painting"
  if (/(draw|sketch)/i.test(title)) return "drawing"
  if (/(jewelry|metal|silver)/i.test(title)) return "jewelry"
  if (/(candle|beeswax|wax)/i.test(title)) return "workshop"
  if (/(kite|paper|origami|bookbind|leather)/i.test(title)) return "workshop"
  return "workshop"
}

function parseTime12(t: string): [number, number] {
  const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return [12, 0]
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0
  return [h, min]
}

function parseEventDates(text: string): { startTime: Date; endTime: Date } | null {
  // Wix detail page format: "May 06, 2026, 6:30 PM – 8:30 PM"
  const m = text.match(
    /(\w+ \d{1,2},\s+\d{4}),\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[–\-—]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i
  )
  if (!m) return null

  const baseDate = new Date(m[1])
  if (isNaN(baseDate.getTime())) return null

  const [sh, sm] = parseTime12(m[2])
  const [eh, em] = parseTime12(m[3])

  const startTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), sh, sm)
  const endTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), eh, em)

  return { startTime, endTime }
}

export async function scrapeCraftSociety(): Promise<ScrapedClass[]> {
  return withBrowser(async (page) => {
    const classes: ScrapedClass[] = []
    const now = new Date()

    console.log("  Loading Craft Society event list...")
    await page.goto(EVENTS_URL, { waitUntil: "load", timeout: 30000 })
    // Wix keeps firing requests; wait for event links to appear instead
    await page.waitForSelector("a[href*='/event-details/']", { timeout: 15000 }).catch(() => {})
    await delay(2000)

    // Collect all event detail links from the listing page
    const events = await page.evaluate(() => {
      const seen = new Set<string>()
      const items: { title: string; url: string }[] = []

      document.querySelectorAll("li").forEach((li) => {
        const detailLinks = Array.from(li.querySelectorAll<HTMLAnchorElement>("a[href*='/event-details/']"))
        if (detailLinks.length === 0) return

        const link = detailLinks[0]
        const url = link.href
        if (seen.has(url)) return
        seen.add(url)

        // Title: prefer heading element, fall back to link text
        const heading = li.querySelector("h2, h3, h4, [data-hook='ev-title'], [data-hook='event-name']")
        const rawTitle = heading?.textContent?.trim() ?? link.textContent?.trim() ?? ""
        const title = rawTitle.split("\n")[0].trim()

        if (title) items.push({ title, url })
      })

      return items
    })

    console.log(`  Found ${events.length} event links`)

    for (const { title, url } of events) {
      try {
        await page.goto(url, { waitUntil: "load", timeout: 30000 })
        await delay(2000)

        const pageText = await page.evaluate(() => document.body.innerText)
        const dates = parseEventDates(pageText)
        if (!dates || dates.startTime < now) continue

        // Price: Wix shows base price then service fee — take the first/largest ticket price
        // and exclude the small service fee line
        const priceMatches = [...pageText.matchAll(/\$\s*(\d+(?:\.\d{2})?)/g)]
        const prices = priceMatches
          .map((m) => parseFloat(m[1]))
          .filter((p) => p >= 10 && p < 500)
        const price = prices.length > 0 ? Math.max(...prices) : 0

        // Description: first substantial paragraph
        const descMatch = pageText.match(/\n([A-Z].{40,400})\n/)
        const description = descMatch?.[1]?.trim() ?? ""

        const durationMin = Math.round((dates.endTime.getTime() - dates.startTime.getTime()) / 60_000)
        const externalId = url.split("/").filter(Boolean).pop() ?? url

        classes.push({
          sourceName: SOURCE_NAME,
          title,
          description: description || `Craft Society workshop. Visit ${url} for details.`,
          category: inferCategory(title),
          startTime: dates.startTime,
          endTime: dates.endTime,
          durationMin,
          price,
          url,
          externalId,
          neighborhood: "Park Slope",
        })

        console.log(
          `  ✓ ${title} | ${dates.startTime.toLocaleDateString()} | $${price}`
        )
      } catch (err) {
        console.warn(`  ✗ Failed ${url}: ${err}`)
      }
    }

    console.log(`  → ${classes.length} sessions found`)
    return classes
  })
}

// Run directly: npx tsx scripts/scrapers/craft-society.ts
if (process.argv[1]?.endsWith("craft-society.ts")) {
  scrapeCraftSociety().then((results) => {
    console.log(`\nTotal sessions: ${results.length}`)
    results.forEach((r) =>
      console.log(
        `  ${r.title} | ${r.startTime.toLocaleDateString()} ${r.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} | $${r.price}`
      )
    )
  })
}
