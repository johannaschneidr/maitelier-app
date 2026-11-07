/**
 * Scrapers read wall-clock times off studio websites ("6:00 pm") and build Dates with
 * `new Date(y, m, d, h, min)`, which uses the machine's time zone. On a laptop in NYC that
 * is correct; on the GitHub Actions runner (UTC) every class lands 4–5 hours early.
 *
 * Import this module FIRST in any script entrypoint that runs scrapers. It pins the process
 * to New York time so every scraper interprets times the way the studio meant them.
 */

process.env.TZ = "America/New_York"

// Sanity check: New York is UTC-5 in January. If this fails, Node ignored TZ and we would
// write wrong times to Firestore — better to stop.
const janOffset = new Date(2026, 0, 15, 12).getTimezoneOffset()
if (janOffset !== 300) {
  throw new Error(`Expected America/New_York (offset 300), got ${janOffset}. Refusing to scrape with wrong time zone.`)
}

export {}
