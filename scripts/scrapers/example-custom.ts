/**
 * Example scraper for a custom/independent website.
 * Copy this file and adapt the selectors for your target site.
 *
 * Run: npx tsx scripts/scrapers/example-custom.ts
 *
 * Then import: npx tsx -e "
 *   const { scrapeExample } = require('./scripts/scrapers/example-custom')
 *   const { importToFirebase } = require('./scripts/importers/import-to-firebase')
 *   scrapeExample().then(importToFirebase).then(r => console.log(r))
 * "
 */
import * as cheerio from "cheerio"
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay, parsePrice } from "./utils"

const SOURCE_NAME = "Brooklyn Brainery"
const BASE_URL = "https://brooklynbrainery.com"

/**
 * Scrape classes from a custom site.
 * Adapt the selectors (e.g. .event, .class-card) to match the target HTML.
 */
export async function scrapeExample(): Promise<ScrapedClass[]> {
  const html = await fetchWithDelay(`${BASE_URL}/courses`)
  const $ = cheerio.load(html)
  const classes: ScrapedClass[] = []

  // Brooklyn Brainery: course links and h3 titles. Adapt selectors for other sites.
  $('a[href*="/courses/"]:not([href*="/courses/past"])').each((_, el) => {
    const $el = $(el)
    const title = $el.text().trim()
    const href = $el.attr("href") || ""
    if (!title || title.length < 3) return

    const url = href.startsWith("http") ? href : `${BASE_URL}${href}`
    const priceText = $el.closest("div, article, li").find(".price, .cost").first().text()
    const price = parsePrice(priceText)

    const dateText = $el.closest("div, article, li").find(".date, time").first().text()
    const { startTime, endTime } = parseDateFromText(dateText)

    classes.push({
      sourceName: SOURCE_NAME,
      title,
      startTime,
      endTime,
      price,
      url,
    })
  })

  return classes
}

/**
 * Parse date/time from text. Override for each site's format.
 * Examples: "Sat Mar 15, 10am" or "2025-03-15 10:00"
 */
function parseDateFromText(text: string): { startTime: Date; endTime: Date } {
  // Fallback: use today + 2 hours if we can't parse
  const start = new Date()
  start.setDate(start.getDate() + 1)
  start.setHours(10, 0, 0, 0)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

  // TODO: Implement actual parsing based on site format
  // e.g. use a library like date-fns or regex for "Mar 15, 10am"
  if (text) {
    const parsed = new Date(text)
    if (!isNaN(parsed.getTime())) {
      return {
        startTime: parsed,
        endTime: new Date(parsed.getTime() + 2 * 60 * 60 * 1000),
      }
    }
  }

  return { startTime: start, endTime: end }
}

