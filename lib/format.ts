/**
 * Display formatting. Every date is shown in New York time, even though
 * the server (Vercel) runs in UTC.
 */

export const TIME_ZONE = "America/New_York"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
})

export type NyParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number }

/** Calendar parts of `d` on a New York clock. month is 0-based, weekday 0 = Sunday. */
export function nyParts(d: Date): NyParts {
  const p: Record<string, string> = {}
  for (const { type, value } of partsFmt.formatToParts(d)) p[type] = value
  return {
    year: Number(p.year),
    month: Number(p.month) - 1,
    day: Number(p.day),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    weekday: WEEKDAYS.indexOf(p.weekday),
  }
}

/** Same shape as Date#toDateString() ("Sat Nov 07 2026"), but for the New York calendar day. */
export function nyDateKey(d: Date): string {
  const p = nyParts(d)
  return `${WEEKDAYS[p.weekday]} ${MONTHS[p.month]} ${String(p.day).padStart(2, "0")} ${p.year}`
}

/** "2 pm", "6:30 pm" */
export function formatTime(d: Date): string {
  return d
    .toLocaleTimeString("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" })
    .replace(":00", "")
    .replace(" AM", " am")
    .replace(" PM", " pm")
}

/** "Saturday, Nov 14, 2 pm" — the form used in answer leads. */
export function formatSessionDate(d: Date): string {
  const date = d.toLocaleDateString("en-US", { timeZone: TIME_ZONE, weekday: "long", month: "short", day: "numeric" })
  return `${date}, ${formatTime(d)}`
}

/** "Sat, Nov 14 · 2 pm – 4 pm" — the form used in schedule rows. */
export function formatSessionRow(start: Date, end: Date): string {
  const date = start.toLocaleDateString("en-US", { timeZone: TIME_ZONE, weekday: "short", month: "short", day: "numeric" })
  return `${date} · ${formatTime(start)} – ${formatTime(end)}`
}

/** "Sat, Nov 14" */
export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { timeZone: TIME_ZONE, weekday: "short", month: "short", day: "numeric" })
}

function hours(min: number): string {
  const h = Math.round((min / 60) * 2) / 2
  return Number.isInteger(h) ? String(h) : h.toFixed(1)
}

/** "2 hours", "90 minutes", "2.5 hours" */
export function formatDuration(min: number): string {
  if (min < 120 && min % 60 !== 0) return `${min} minutes`
  const h = hours(min)
  return h === "1" ? "1 hour" : `${h} hours`
}

/** "2-hour", "90-minute", "2.5-hour" — for use before a noun. */
export function durationAdjective(min: number): string {
  if (min < 120 && min % 60 !== 0) return `${min}-minute`
  return `${hours(min)}-hour`
}

export function formatPrice(dollars: number): string {
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`
}

/** "just now", "3 hours ago", "2 days ago" */
export function formatRelative(d: Date, now = new Date()): string {
  const min = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000))
  if (min < 2) return "just now"
  if (min < 60) return `${min} minutes ago`
  const h = Math.round(min / 60)
  if (h < 48) return h === 1 ? "1 hour ago" : `${h} hours ago`
  return `${Math.round(h / 24)} days ago`
}

/** "a", "b and c" */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

/** Indefinite article for the word that follows: "an 8-hour", "an intermediate", "a 2-hour". */
export function article(nextWord: string): "a" | "an" {
  return /^(8|11|18|[aeiou])/i.test(nextWord) ? "an" : "a"
}

/** URL slug: lowercase, ascii, hyphenated. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "")
}
