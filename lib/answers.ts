/**
 * Answer-first leads: two sentences built from the data, placed directly under
 * the H1 of each page. Answer engines lift the first, most specific sentences,
 * so these name the price, duration, neighborhood and next date up front.
 *
 * Pure functions (no I/O) so they can be tested and reused for meta descriptions.
 */
import type { ClassView, SessionView, StudioView } from "@/lib/catalog"
import { getCraft, type CraftSlug } from "@/lib/taxonomy/crafts"
import {
  article,
  durationAdjective,
  formatPrice,
  formatSessionDate,
  joinList,
} from "@/lib/format"

export type Lead = { headline: string; detail: string }

const LEVEL_WORD: Record<NonNullable<ClassView["attrs"]["level"]>, string> = {
  beginner: "beginner",
  "all-levels": "all-levels",
  intermediate: "intermediate",
  advanced: "advanced",
}

export function seatsPhrase(s: SessionView): string {
  if (s.spotsLeft === 0) return "sold out"
  if (s.capacity > 0 && s.spotsLeft > 0) return s.spotsLeft === 1 ? "1 seat left" : `${s.spotsLeft} seats left`
  return ""
}

function nextSessionSentence(s: SessionView | undefined): string {
  if (!s) return "No sessions are scheduled right now."
  const seats = seatsPhrase(s)
  return `Next session: ${formatSessionDate(s.start)}${seats ? ` (${seats})` : ""}.`
}

function takeHomeSentence(c: ClassView): string {
  const { whatYouMake, takeHome, pickupAfter } = c.attrs
  if (!whatYouMake && !takeHome) return ""
  const make = whatYouMake ? `You make ${whatYouMake}` : ""
  let home = ""
  if (takeHome === "same-day") home = "you take it home the same day"
  if (takeHome === "fired-later") home = `the studio fires ${make ? "them" : "your pieces"} for pickup${pickupAfter ? ` ${pickupAfter} later` : " later"}`
  if (takeHome === "no") home = "nothing goes home with you"
  if (make && home) return `${make}, and ${home}.`
  if (make) return `${make}.`
  return `${home.charAt(0).toUpperCase()}${home.slice(1)}.`
}

/**
 * "Wheel Throwing 101 at Choplet is a 2-hour beginner pottery class in Williamsburg for $95."
 * "You make 2–3 bowls, and pieces are … ready for pickup 3 weeks later. Next session: Saturday, Nov 14, 2 pm (4 seats left)."
 */
export function classLead(c: ClassView): Lead {
  const craft = getCraft(c.craft)!
  const descriptors = [
    c.durationMin > 0 ? durationAdjective(c.durationMin) : "",
    c.attrs.level ? LEVEL_WORD[c.attrs.level] : "",
    craft.noun,
  ].filter(Boolean)
  const kind = c.craft === "mixed" ? "workshop" : "class"
  const where = c.studio.neighborhood ? ` in ${c.studio.neighborhood}` : " in New York City"
  const price = c.price > 0 ? ` for ${formatPrice(c.price)}` : ""
  const headline = `${c.title} at ${c.studio.name} is ${article(descriptors[0])} ${descriptors.join(" ")} ${kind}${where}${price}.`
  const detail = [takeHomeSentence(c), nextSessionSentence(c.sessions[0])].filter(Boolean).join(" ")
  return { headline, detail }
}

function craftNouns(crafts: CraftSlug[]): string {
  return joinList(crafts.slice(0, 3).map((slug) => getCraft(slug)!.noun))
}

function priceSpan(prices: number[]): string {
  const p = prices.filter((x) => x > 0)
  if (p.length === 0) return ""
  const min = Math.min(...p)
  const max = Math.max(...p)
  return min === max ? `, at ${formatPrice(min)}` : `, from ${formatPrice(min)} to ${formatPrice(max)}`
}

/**
 * "Choplet is a pottery studio in Williamsburg with 6 classes on the schedule, from $45 to $120."
 * "Next up: Wheel Throwing 101 on Saturday, Nov 14, 2 pm."
 */
export function studioLead(v: StudioView): Lead {
  const { studio } = v
  const kind = v.crafts.length > 0 ? `${craftNouns(v.crafts)} studio` : "creative workshop studio"
  const where = studio.neighborhood ? ` in ${studio.neighborhood}` : " in New York City"
  const scheduled = v.classes.filter((c) => c.sessions.length > 0)
  if (scheduled.length === 0) {
    return {
      headline: `${studio.name} is ${article(kind)} ${kind}${where}.`,
      detail: "No classes are on its schedule right now; check the studio's own site for new dates.",
    }
  }
  const count = scheduled.length === 1 ? "1 class" : `${scheduled.length} classes`
  const next = scheduled[0]
  return {
    headline: `${studio.name} is ${article(kind)} ${kind}${where} with ${count} on the schedule${priceSpan(scheduled.map((c) => c.price))}.`,
    detail: `Next up: ${next.title} on ${formatSessionDate(next.sessions[0].start)}.`,
  }
}

/**
 * "Maitelier lists 38 pottery classes at 14 New York City studios, from $45 to $180."
 * "The next one is Wheel Throwing 101 at Choplet in Williamsburg on Saturday, Nov 14, 2 pm."
 */
export function craftLead(craftSlug: CraftSlug, upcoming: ClassView[]): Lead {
  const craft = getCraft(craftSlug)!
  const noun = craftSlug === "mixed" ? "creative" : craft.noun
  if (upcoming.length === 0) {
    return {
      headline: `No ${noun} classes in New York City are on Maitelier's schedule right now.`,
      detail: "New dates are added as studios publish them; check back soon.",
    }
  }
  const studios = new Set(upcoming.map((c) => c.studio.slug)).size
  const classes = upcoming.length === 1 ? `1 ${noun} class` : `${upcoming.length} ${noun} classes`
  const at = studios === 1 ? "1 New York City studio" : `${studios} New York City studios`
  const next = upcoming[0]
  const where = next.studio.neighborhood ? ` in ${next.studio.neighborhood}` : ""
  return {
    headline: `Maitelier lists ${classes} at ${at}${priceSpan(upcoming.map((c) => c.price))}.`,
    detail: `The next one is ${next.title} at ${next.studio.name}${where} on ${formatSessionDate(next.sessions[0].start)}.`,
  }
}
