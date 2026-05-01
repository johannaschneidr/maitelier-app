/**
 * ArtsClub scraper — art studio, East Village.
 * Squarespace event listing, fully server-rendered.
 *
 * Listing page: /east-village-events
 * HTML: article.eventlist-event--upcoming → title, date, start/end time all on listing page.
 * Price: not shown on listing; Acuity booking links are in the excerpt but don't expose price.
 */

import * as cheerio from "cheerio"
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay } from "./utils"

const SOURCE_NAME = "ArtsClub"
const BASE_URL = "https://www.artsclubstudios.com"
const EVENTS_URL = `${BASE_URL}/east-village-events`

function inferCategory(title: string): string {
  if (/(paint|watercolor|acrylic|oil paint|impressi|monet|frida|warhol)/i.test(title)) return "painting"
  if (/(draw|sketch|illustration|figure)/i.test(title)) return "drawing"
  if (/(ceramic|pottery|clay)/i.test(title)) return "ceramics"
  if (/(print|lino|screen print|block print)/i.test(title)) return "printmaking"
  if (/(textile|weav|knit|yarn|fiber|macram|embroider)/i.test(title)) return "textile"
  if (/(wood|carpent)/i.test(title)) return "woodworking"
  if (/(jewelry|metal|silver)/i.test(title)) return "jewelry"
  if (/(photograph|photo)/i.test(title)) return "photography"
  if (/(candle|soap|wax)/i.test(title)) return "workshop"
  return "workshop"
}

function parseTime(text: string): [number, number] {
  const m = text.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return [12, 0]
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0
  return [h, min]
}

function buildDate(isoDate: string, timeText: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number)
  const [h, min] = parseTime(timeText)
  return new Date(year, month - 1, day, h, min)
}

export async function scrapeArtsClub(): Promise<ScrapedClass[]> {
  const html = await fetchWithDelay(EVENTS_URL)
  const $ = cheerio.load(html)
  const classes: ScrapedClass[] = []
  const now = new Date()

  $("article.eventlist-event--upcoming").each((_, el) => {
    const $el = $(el)

    const titleEl = $el.find(".eventlist-title-link")
    const title = titleEl.text().trim()
    const slug = titleEl.attr("href") ?? ""
    if (!title || !slug) return

    const url = `${BASE_URL}${slug}`
    const isoDate = $el.find("time.event-date").attr("datetime") ?? ""
    const startText = $el.find("time.event-time-localized-start").text().trim()
    const endText = $el.find("time.event-time-localized-end").text().trim()

    if (!isoDate || !startText) return

    const startTime = buildDate(isoDate, startText)
    const endTime = endText
      ? buildDate(isoDate, endText)
      : new Date(startTime.getTime() + 2 * 60 * 60_000)

    if (startTime < now) return

    const description = $el.find(".eventlist-excerpt p").first().text().trim().slice(0, 500)
    const durationMin = Math.round((endTime.getTime() - startTime.getTime()) / 60_000)
    const externalId = slug.split("/").filter(Boolean).pop() ?? slug

    classes.push({
      sourceName: SOURCE_NAME,
      title,
      description: description || `ArtsClub workshop. Visit ${url} for details.`,
      category: inferCategory(title),
      startTime,
      endTime,
      durationMin,
      price: 0,
      url,
      externalId,
      neighborhood: "East Village",
    })
  })

  console.log(`  → ${classes.length} sessions found`)
  return classes
}

// Run directly: npx tsx scripts/scrapers/artsclub.ts
if (process.argv[1]?.endsWith("artsclub.ts")) {
  scrapeArtsClub().then((results) => {
    console.log(`\nTotal sessions: ${results.length}`)
    results.forEach((r) =>
      console.log(`  ${r.title} | ${r.startTime.toLocaleDateString()} ${r.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)
    )
  })
}
