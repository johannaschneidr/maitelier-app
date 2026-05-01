/**
 * FareHarbor scraper — works for any studio using the FareHarbor calendar embed.
 * Currently configured for: Brooklyn Glass, Craftsman Ave.
 *
 * Two FareHarbor embed layouts are supported:
 *   "small-calendar" — date-picker grid (Brooklyn Glass): click date → see item groups
 *   "agenda"         — list view (Craftsman Ave): sessions listed directly per date
 *
 * Only single-day sessions are included; multi-week courses are filtered out.
 */

import type { ScrapedClass } from "../../types/scraped"
import { withBrowser, delay } from "./playwright-utils"
import type { Frame } from "playwright"

type FareHarborSource = {
  sourceName: string
  classesUrl: string
  neighborhood: string
}

const SOURCES: FareHarborSource[] = [
  {
    sourceName: "Brooklyn Glass",
    classesUrl: "https://brooklynglass.com/classes",
    neighborhood: "Gowanus",
  },
  {
    sourceName: "Craftsman Ave",
    classesUrl: "https://craftsmanave.com/events-calendar/",
    neighborhood: "Industry City",
  },
]

const MONTHS_TO_SCAN = 3

function inferCategory(title: string): string {
  if (/(glass|blow|fus|kiln|neon|flamework)/i.test(title)) return "glassblowing"
  if (/(wood|carpent|joinery|turn|table|chair|furniture)/i.test(title)) return "woodworking"
  if (/(ceramic|pottery|clay)/i.test(title)) return "ceramics"
  if (/(jewelry|metal|silver|forge|weld|copper)/i.test(title)) return "jewelry"
  if (/(stained glass)/i.test(title)) return "glassblowing"
  if (/(paint|watercolor|acrylic)/i.test(title)) return "painting"
  if (/(leather|bookbind)/i.test(title)) return "workshop"
  return "workshop"
}

function parseTime12(text: string): [number, number] {
  const m = text.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return [12, 0]
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0
  return [h, min]
}

// ─── Small calendar layout (Brooklyn Glass) ───────────────────────────────────

async function getAvailableDaysSmall(frame: Frame): Promise<{ day: string; datetime: string }[]> {
  return frame.evaluate(() => {
    return [...document.querySelectorAll("li.fh-calendar-day[data-test-id=\"small-calendar-body-day\"]")]
      .filter((d) => d.getAttribute("aria-disabled") !== "true")
      .map((d) => ({
        day: d.getAttribute("data-day") ?? "",
        datetime: d.querySelector("time")?.getAttribute("datetime") ?? "",
      }))
      .filter((d) => d.day && d.datetime)
  })
}

async function getSessionsForDaySmall(frame: Frame): Promise<{ title: string; time: string; isSeries: boolean }[]> {
  return frame.evaluate(() => {
    return [...document.querySelectorAll("div.item-group")].flatMap((group) => {
      const title = group.querySelector("p.fh-text.fh-text--display-md")?.textContent?.trim() ?? ""
      if (!title) return []
      return [...group.querySelectorAll("button.calendarBlock:not(.not-bookable)")].map((slot) => {
        const time = slot.querySelector("[data-test-id=\"availability-item-title\"]")?.textContent?.trim() ?? ""
        const isSeries = /Ends\s+\d/.test((slot as HTMLElement).innerText)
        return { title, time, isSeries }
      })
    })
  })
}

async function scrapeSmallCalendar(
  frame: Frame,
  sourceName: string,
  neighborhood: string,
  now: Date,
  classes: ScrapedClass[]
) {
  for (let month = 0; month < MONTHS_TO_SCAN; month++) {
    if (month > 0) {
      try {
        await frame.locator("button:has-text(\"Next month\")").click({ timeout: 8000 })
        await delay(2000)
      } catch {
        break
      }
    }

    let availDays: { day: string; datetime: string }[]
    try {
      availDays = await getAvailableDaysSmall(frame)
    } catch {
      break
    }
    console.log(`  [${sourceName}] Month ${month + 1}: ${availDays.length} available days`)

    for (const { day, datetime } of availDays) {
      const parts = datetime.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (!parts) continue
      const date = new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]))
      if (date < now) continue

      try {
        await frame.click(
          `li.fh-calendar-day[data-day="${day}"][data-test-id="small-calendar-body-day"]:not([aria-disabled="true"])`,
          { timeout: 5000 }
        )
        await delay(1500)
      } catch {
        continue
      }

      let sessions: { title: string; time: string; isSeries: boolean }[]
      try {
        sessions = await getSessionsForDaySmall(frame)
      } catch {
        continue
      }

      for (const { title, time, isSeries } of sessions) {
        if (isSeries) continue
        if (/^[A-Z]{2,4}\d+:/.test(title)) continue // course codes like GB3:, FW1:

        const [h, min] = parseTime12(time)
        const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min)
        const endTime = new Date(startTime.getTime() + 120 * 60_000)
        const externalId = `${sourceName}-${title}-${datetime}-${time}`
          .replace(/[^a-zA-Z0-9]/g, "-")
          .toLowerCase()
          .slice(0, 80)

        classes.push({
          sourceName,
          title,
          description: `${title} at ${sourceName}. Visit the booking page for full details.`,
          category: inferCategory(title),
          startTime,
          endTime,
          durationMin: 120,
          price: 0,
          externalId,
          neighborhood,
        })
        console.log(`  [${sourceName}]   ✓ ${title} | ${startTime.toLocaleDateString()} ${time}`)
      }
    }
  }
}

// ─── Agenda layout (Craftsman Ave) ────────────────────────────────────────────

async function scrapeAgendaCalendar(
  frame: Frame,
  sourceName: string,
  neighborhood: string,
  now: Date,
  classes: ScrapedClass[]
) {
  for (let month = 0; month < MONTHS_TO_SCAN; month++) {
    if (month > 0) {
      try {
        await frame.locator("button:has-text(\"Next month\")").click({ timeout: 8000 })
        await delay(2000)
      } catch {
        break
      }
    }

    const sessions = await frame.evaluate((nowStr) => {
      const results: { title: string; time: string; dateText: string; waitlist: boolean }[] = []
      const now = new Date(nowStr)

      document.querySelectorAll("button.availability").forEach((btn) => {
        const lines = (btn as HTMLElement).innerText.split("\n").map((l) => l.trim()).filter(Boolean)
        const time = lines[0] ?? ""
        const title = lines[1] ?? btn.getAttribute("aria-label") ?? ""
        const waitlist = (btn as HTMLElement).innerText.includes("Waitlist")

        // Find nearest date in parent chain
        let el = btn.parentElement
        let dateText = ""
        for (let i = 0; i < 10 && el; i++) {
          const m = (el as HTMLElement).innerText?.match(
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}/
          )
          if (m) { dateText = m[0]; break }
          el = el.parentElement
        }

        if (title && time && dateText) {
          results.push({ title: title.slice(0, 80), time, dateText, waitlist })
        }
      })
      return results
    }, now.toISOString())

    const monthSessions = sessions.filter((s) => !s.waitlist)
    console.log(`  [${sourceName}] Month ${month + 1}: ${monthSessions.length} bookable sessions`)

    for (const { title, time, dateText } of monthSessions) {
      const date = new Date(dateText)
      if (isNaN(date.getTime()) || date < now) continue

      const [h, min] = parseTime12(time)
      const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min)
      const endTime = new Date(startTime.getTime() + 120 * 60_000)
      const externalId = `${sourceName}-${title}-${dateText}-${time}`
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase()
        .slice(0, 80)

      classes.push({
        sourceName,
        title,
        description: `${title} at ${sourceName}. Visit the booking page for full details.`,
        category: inferCategory(title),
        startTime,
        endTime,
        durationMin: 120,
        price: 0,
        externalId,
        neighborhood,
      })
      console.log(`  [${sourceName}]   ✓ ${title} | ${startTime.toLocaleDateString()} ${time}`)
    }
  }
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

async function scrapeFareHarborSource(source: FareHarborSource): Promise<ScrapedClass[]> {
  const { sourceName, classesUrl, neighborhood } = source
  const classes: ScrapedClass[] = []

  await withBrowser(async (page) => {
    console.log(`  [${sourceName}] Loading ${classesUrl}`)
    await page.goto(classesUrl, { waitUntil: "load" })
    await delay(6000)

    const calFrame = page.frames().find((f) => f.url().includes("/embeds/calendar/"))
    if (!calFrame) {
      console.warn(`  [${sourceName}] FareHarbor calendar iframe not found`)
      return
    }
    await delay(3000)

    const now = new Date()

    // Detect layout: small calendar vs agenda
    const hasSmallCalendar = await calFrame.evaluate(() =>
      document.querySelectorAll("li.fh-calendar-day").length > 0
    )
    const hasAgenda = await calFrame.evaluate(() =>
      document.querySelectorAll("button.availability").length > 0
    )

    if (hasSmallCalendar) {
      console.log(`  [${sourceName}] Using small-calendar layout`)
      await scrapeSmallCalendar(calFrame, sourceName, neighborhood, now, classes)
    } else if (hasAgenda) {
      console.log(`  [${sourceName}] Using agenda layout`)
      await scrapeAgendaCalendar(calFrame, sourceName, neighborhood, now, classes)
    } else {
      console.warn(`  [${sourceName}] Unknown FareHarbor layout`)
    }

    console.log(`  [${sourceName}] → ${classes.length} sessions found`)
  }).catch((err) => {
    console.warn(`  [${sourceName}] Browser error (partial results kept): ${err}`)
  })

  return classes
}

export async function scrapeFareHarbor(): Promise<ScrapedClass[]> {
  const all: ScrapedClass[] = []
  for (const source of SOURCES) {
    try {
      const results = await scrapeFareHarborSource(source)
      all.push(...results)
    } catch (err) {
      console.error(`  FareHarbor scraper failed for ${source.sourceName}: ${err}`)
    }
  }
  return all
}

// Run directly: npx tsx scripts/scrapers/fareharbor.ts
if (process.argv[1]?.endsWith("fareharbor.ts")) {
  scrapeFareHarbor().then((results) => {
    console.log(`\nTotal sessions: ${results.length}`)
    results.forEach((r) =>
      console.log(
        `  ${r.sourceName} | ${r.title} | ${r.startTime.toLocaleDateString()} | $${r.price}`
      )
    )
  })
}
