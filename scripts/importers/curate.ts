/**
 * Editorial check that runs on every scrape before import.
 *
 * Studio calendars mix real hands-on classes with lectures, parties, gallery walks and
 * leftover pages from past months. Maitelier is a hand-picked index of craft classes, so
 * anything that isn't clearly a hands-on craft class is dropped here, and a few categories
 * that scrapers guess wrong are corrected.
 *
 * Every drop is logged with a reason, so it's easy to see what got filtered on each run.
 * To let something through, adjust the patterns below.
 */

import type { ScrapedClass } from "../../types/scraped"
import { nyParts } from "../../lib/format"

// ─── Not a craft class ────────────────────────────────────────────────────────
// Checked against the title. These are never workshops, whatever the studio calls them.
const NON_CRAFT_TITLE: [RegExp, string][] = [
  [/\b(gallery|art)\s+(crawl|walk|tour)\b/i, "gallery crawl / tour"],
  [/\b(walking\s+tour|tour|cemetery|journey through)\b/i, "tour"],
  [/\b(lecture|talk|panel|discussion|history of|the history)\b/i, "lecture / talk"],
  [/\bholiday\s+party\b/i, "party"],
  [/\bopen\s+studios\b/i, "open studios event"],
  [/\bgift\s+(card|certificate)s?\b/i, "gift card"],
  [/\b(mahjong|trivia|book\s+club|screening|film\s+night|networking|happy\s+hour)\b/i, "social event"],
  [/\b(improv|tarot\s+101|energy\s+protection|burnout|empath)\b/i, "not a craft"],
  [/\b(writ(ing|er'?s?)|poetry|storytelling)\b/i, "writing class"],
]

// Scraper categories that are never craft.
const NON_CRAFT_CATEGORIES = new Set(["writing", "nature"])

// When a scraper couldn't place a class (category "workshop"), require some sign that you
// actually make something. Checked against title + description.
const HANDS_ON = new RegExp(
  [
    "mak(e|ing)", "hands-on", "craft", "creat(e|ing)", "build", "sculpt", "carv", "mold",
    "paint", "draw", "sketch", "collage", "cyanotype", "print", "dye", "shibori", "indigo",
    "sew", "knit", "crochet", "embroider", "stitch", "weav", "woven", "felt", "basket", "rattan",
    "macram", "knot", "mizuhiki", "bracelet", "jewelry", "bead",
    "clay", "ceramic", "pottery", "glass", "wood", "kumiko", "joinery",
    "candle", "beeswax", "soap", "flower", "floral", "ikebana", "wreath", "bonsai",
    "doll", "kimekomi", "trinket", "ornament", "lampshade", "vision board",
    "sushi", "wagashi", "confection", "bak(e|ing)", "cook", "tea ceremony", "chanoyu",
    "studio session",
  ].join("|"),
  "i"
)

// ─── Stale titles ─────────────────────────────────────────────────────────────
const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]
const MONTH_RE = new RegExp(`\\b(${MONTHS.join("|")})\\b`, "gi")

/** "Crochet Club: October" running in November, or "2025 Holiday Market" in 2026. */
function staleTitleReason(cls: ScrapedClass): string | null {
  const { year, month } = nyParts(cls.startTime)

  const named = [...cls.title.matchAll(MONTH_RE)].map((m) => MONTHS.indexOf(m[1].toLowerCase()))
  if (named.length > 0 && !named.includes(month)) {
    return `title names ${MONTHS[named[0]]} but session is in ${MONTHS[month]}`
  }

  const years = [...cls.title.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]))
  if (years.length > 0 && years.every((y) => y < year)) {
    return `title names ${years[0]} but session is in ${year}`
  }
  return null
}

// ─── Category corrections ─────────────────────────────────────────────────────
// High-confidence title patterns that override whatever the scraper guessed.
const CATEGORY_OVERRIDES: [RegExp, string][] = [
  // Glass: only hot-shop blowing is "glassblowing"; stained glass, mosaic, fusing, beads, neon are "glass art"
  [/\b(stained\s+glass|mosaic|fus(e|ing)|slump|kiln|cast(ing)?|p[aâ]te\s+de\s+verre|coldwork|neon|bead|boro|flamework|torch|lampwork|suncatcher)/i, "glass art"],
  [/\b(glassblow|blown|blowing|hot\s+shop|punties|gathers|paperweight|ornament)/i, "glassblowing"],
  [/\b(letter(ing)?|calligraph)/i, "drawing"],
  [/\b(weav|woven|basket|rattan|crochet|knit|sew(ing)?|embroider|macram)/i, "textiles"],
  [/\b(candle|beeswax)/i, "candle making"],
  [/\b(clay|ceramic|pottery)\b/i, "ceramics"],
]

function correctedCategory(cls: ScrapedClass): string | undefined {
  // Only touch glass categories when the scraper already thinks it's glass, so "Blown Away
  // by Watercolor" stays painting. Non-glass overrides apply to anything.
  const isGlass = /glass/i.test(cls.category ?? "") || /glass/i.test(cls.title)
  for (const [re, category] of CATEGORY_OVERRIDES) {
    const glassRule = category === "glass art" || category === "glassblowing"
    if (glassRule && !isGlass) continue
    if (re.test(cls.title)) return category
  }
  return cls.category
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type Dropped = { cls: ScrapedClass; reason: string }

export function curate(classes: ScrapedClass[]): { kept: ScrapedClass[]; dropped: Dropped[] } {
  const kept: ScrapedClass[] = []
  const dropped: Dropped[] = []

  for (const cls of classes) {
    const blocked = NON_CRAFT_TITLE.find(([re]) => re.test(cls.title))
    if (blocked) {
      dropped.push({ cls, reason: blocked[1] })
      continue
    }

    const stale = staleTitleReason(cls)
    if (stale) {
      dropped.push({ cls, reason: stale })
      continue
    }

    if (cls.category && NON_CRAFT_CATEGORIES.has(cls.category)) {
      dropped.push({ cls, reason: `category "${cls.category}"` })
      continue
    }

    const category = correctedCategory(cls)
    if ((category ?? "workshop") === "workshop" && !HANDS_ON.test(`${cls.title} ${cls.description ?? ""}`)) {
      dropped.push({ cls, reason: "no sign it's a hands-on craft class" })
      continue
    }

    kept.push({ ...cls, category })
  }

  return { kept, dropped }
}

/** One line per dropped title (deduped across sessions) for the scrape log. */
export function logDropped(dropped: Dropped[]): void {
  if (dropped.length === 0) return
  const byTitle = new Map<string, { reason: string; count: number }>()
  for (const { cls, reason } of dropped) {
    const key = `${cls.sourceName} — ${cls.title}`
    const entry = byTitle.get(key) ?? { reason, count: 0 }
    entry.count++
    byTitle.set(key, entry)
  }
  console.log(`\nFiltered out ${dropped.length} sessions (${byTitle.size} titles):`)
  for (const [title, { reason, count }] of byTitle) {
    console.log(`  ✗ ${title} (${count}×) — ${reason}`)
  }
}
