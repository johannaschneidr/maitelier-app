/**
 * The catalog: Sources, ClassTemplates and upcoming ClassSessions joined into
 * the shapes the Class, Studio and Craft hub pages render. Loaded once per request.
 *
 * Built on the current Firestore schema (Source / ClassTemplate / ClassSession).
 * When the Weeks 1–2 schema (studios / classes / sessions) lands, only this file
 * should need to change.
 */
import { cache } from "react"
import { getAllUpcomingSessions, getSources, getTemplates } from "@/lib/queries"
import { craftForClass, type CraftSlug } from "@/lib/taxonomy/crafts"
import { slugify } from "@/lib/format"
import type { ClassTemplate, Source } from "@/types/db"

export type Studio = Source & { slug: string }

export type SessionView = {
  id: string
  /** The ClassTemplate this session belongs to (used for /go/ links). */
  templateId: string
  start: Date
  end: Date
  /** -1 = unknown */
  capacity: number
  /** -1 = unknown */
  spotsLeft: number
  lastCheckedAt?: Date
}

export type ClassView = {
  /** Public URL slug: {studio-slug}-{title}. */
  slug: string
  /** Primary ClassTemplate id. */
  id: string
  title: string
  description: string
  craft: CraftSlug
  durationMin: number
  /** Dollars; 0 = unknown */
  price: number
  /** Studio's own booking page for this class, if known. */
  bookingUrl?: string
  attrs: Pick<ClassTemplate, "level" | "whatYouMake" | "takeHome" | "pickupAfter" | "materialsIncluded" | "byob" | "minAge">
  studio: Studio
  /** Upcoming, de-duplicated, soonest first. */
  sessions: SessionView[]
  lastCheckedAt?: Date
}

export type StudioView = {
  studio: Studio
  /** Classes with upcoming sessions first (soonest first), then the rest A–Z. */
  classes: ClassView[]
  crafts: CraftSlug[]
  lastCheckedAt?: Date
}

export type Catalog = {
  classes: ClassView[]
  classBySlug: Map<string, ClassView>
  studioBySlug: Map<string, StudioView>
}

export function classSlug(studioSlug: string, title: string): string {
  const t = slugify(title)
  return t.startsWith(studioSlug) ? t : `${studioSlug}-${t}`
}

function maxDate(dates: (Date | undefined)[]): Date | undefined {
  let max: Date | undefined
  for (const d of dates) if (d && (!max || d > max)) max = d
  return max
}

/** Soonest upcoming session first; classes with nothing scheduled go last, A–Z. */
export function bySoonest(a: ClassView, b: ClassView): number {
  const as = a.sessions[0]?.start.getTime() ?? Infinity
  const bs = b.sessions[0]?.start.getTime() ?? Infinity
  return as - bs || a.title.localeCompare(b.title)
}

/** Pick the template that carries the most information when several share a slug. */
function primaryTemplate(group: ClassTemplate[]): ClassTemplate {
  return [...group].sort(
    (a, b) => Number(!!b.url) - Number(!!a.url) || b.description.length - a.description.length
  )[0]
}

export const getCatalog = cache(async (): Promise<Catalog> => {
  const [sources, templates, sessions] = await Promise.all([getSources(), getTemplates(), getAllUpcomingSessions()])

  const studioById = new Map<string, Studio>()
  for (const s of sources) if (s.slug) studioById.set(s.id, s as Studio)

  // Templates with the same studio + title share one class page.
  const groups = new Map<string, ClassTemplate[]>()
  const slugByTemplateId = new Map<string, string>()
  for (const t of templates) {
    const studio = studioById.get(t.sourceId)
    if (!studio || !t.title.trim()) continue
    const slug = classSlug(studio.slug, t.title)
    groups.set(slug, [...(groups.get(slug) ?? []), t])
    slugByTemplateId.set(t.id, slug)
  }

  // Scrapes can write the same session more than once: keep one per class + start time,
  // and treat the newest write as the time we last saw it.
  const sessionsBySlug = new Map<string, Map<number, SessionView>>()
  for (const s of sessions) {
    const slug = slugByTemplateId.get(s.templateId)
    if (!slug) continue
    const bucket = sessionsBySlug.get(slug) ?? new Map<number, SessionView>()
    const key = s.startTime.getTime()
    const existing = bucket.get(key)
    if (!existing || (s.lastCheckedAt && (!existing.lastCheckedAt || s.lastCheckedAt > existing.lastCheckedAt))) {
      bucket.set(key, {
        id: s.id,
        templateId: s.templateId,
        start: s.startTime,
        end: s.endTime,
        capacity: s.capacity,
        spotsLeft: s.spotsLeft,
        lastCheckedAt: s.lastCheckedAt,
      })
    }
    sessionsBySlug.set(slug, bucket)
  }

  const classes: ClassView[] = []
  for (const [slug, group] of groups) {
    const t = primaryTemplate(group)
    const studio = studioById.get(t.sourceId)!
    const classSessions = [...(sessionsBySlug.get(slug)?.values() ?? [])].sort((a, b) => a.start.getTime() - b.start.getTime())
    const first = classSessions[0]
    const durationMin = t.durationMin > 0 ? t.durationMin : first ? Math.round((first.end.getTime() - first.start.getTime()) / 60000) : 0
    classes.push({
      slug,
      id: t.id,
      title: t.title.trim(),
      description: t.description,
      craft: craftForClass(t.category, t.title),
      durationMin,
      price: t.price > 0 ? t.price : (group.find((g) => g.price > 0)?.price ?? 0),
      bookingUrl: t.url,
      attrs: {
        level: t.level,
        whatYouMake: t.whatYouMake,
        takeHome: t.takeHome,
        pickupAfter: t.pickupAfter,
        materialsIncluded: t.materialsIncluded,
        byob: t.byob,
        minAge: t.minAge,
      },
      studio,
      sessions: classSessions,
      lastCheckedAt: maxDate(classSessions.map((s) => s.lastCheckedAt)),
    })
  }
  classes.sort(bySoonest)

  const studioBySlug = new Map<string, StudioView>()
  for (const studio of studioById.values()) {
    studioBySlug.set(studio.slug, { studio, classes: [], crafts: [], lastCheckedAt: undefined })
  }
  for (const c of classes) studioBySlug.get(c.studio.slug)!.classes.push(c)
  for (const view of studioBySlug.values()) {
    const counts = new Map<CraftSlug, number>()
    for (const c of view.classes) if (c.craft !== "mixed") counts.set(c.craft, (counts.get(c.craft) ?? 0) + 1)
    view.crafts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([craft]) => craft)
    view.lastCheckedAt = maxDate(view.classes.map((c) => c.lastCheckedAt))
  }

  return { classes, classBySlug: new Map(classes.map((c) => [c.slug, c])), studioBySlug }
})

/** Classes in a craft that have at least one upcoming session, soonest first. */
export function upcomingInCraft(catalog: Catalog, craft: CraftSlug): ClassView[] {
  return catalog.classes.filter((c) => c.craft === craft && c.sessions.length > 0)
}

export function priceRange(classes: ClassView[]): { min: number; max: number } | undefined {
  const prices = classes.map((c) => c.price).filter((p) => p > 0)
  if (prices.length === 0) return undefined
  return { min: Math.min(...prices), max: Math.max(...prices) }
}
