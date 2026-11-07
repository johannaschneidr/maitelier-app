/**
 * Import scraped classes into Firebase.
 * Run with: npx tsx scripts/importers/import-to-firebase.ts
 *
 * Usage:
 *   const scraped = await scrapeBrooklynBrainery()
 *   await importToFirebase(scraped)
 */

import { db } from "../../lib/firebase"
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore"
import type { Source, StudioInstructor, ClassTemplate, ClassSession } from "../../types/db"
import type { ScrapedClass } from "../../types/scraped"

/** Find Source by name, or null if not found */
async function findSourceByName(name: string): Promise<{ id: string } | null> {
  const q = query(collection(db, "Source"), where("name", "==", name))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id }
}

/** Create a new Source */
async function createSource(
  name: string,
  type: Source["type"] = "studio",
  address?: string,
  neighborhood?: string
): Promise<string> {
  const ref = doc(collection(db, "Source"))
  const data: Record<string, unknown> = {
    id: ref.id,
    name,
    type,
    createdAt: serverTimestamp(),
  }
  if (address) data.address = address
  if (neighborhood) data.neighborhood = neighborhood
  await setDoc(ref, data as unknown as Source)
  return ref.id
}

/** Update Source with address/neighborhood if provided */
async function updateSourceIfNeeded(
  sourceId: string,
  address?: string,
  neighborhood?: string
): Promise<void> {
  if (!address && !neighborhood) return
  const ref = doc(db, "Source", sourceId)
  const updates: Record<string, string> = {}
  if (address) updates.address = address
  if (neighborhood) updates.neighborhood = neighborhood
  if (Object.keys(updates).length > 0) {
    await updateDoc(ref, updates)
  }
}

/** Get or create Source, return sourceId */
async function getOrCreateSource(
  sourceName: string,
  address?: string,
  neighborhood?: string
): Promise<string> {
  const existing = await findSourceByName(sourceName)
  if (existing) {
    await updateSourceIfNeeded(existing.id, address, neighborhood)
    return existing.id
  }
  return createSource(sourceName, "studio", address, neighborhood)
}

/** Find or create default instructor for a source */
async function getOrCreateInstructor(sourceId: string, instructorName?: string): Promise<string> {
  const q = query(
    collection(db, "StudioInstructor"),
    where("sourceId", "==", sourceId)
  )
  const snap = await getDocs(q)
  if (!snap.empty) return snap.docs[0].id

  const ref = doc(collection(db, "StudioInstructor"))
  await setDoc(ref, {
    id: ref.id,
    sourceId,
    name: instructorName || "Instructor",
    createdAt: serverTimestamp(),
  } as unknown as StudioInstructor)
  return ref.id
}

/** Find ClassTemplate by sourceId + title */
async function findTemplate(sourceId: string, title: string): Promise<string | null> {
  const q = query(
    collection(db, "ClassTemplate"),
    where("sourceId", "==", sourceId),
    where("title", "==", title)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].id
}

/** Create ClassTemplate */
async function createTemplate(
  sourceId: string,
  instructorId: string,
  data: Omit<ClassTemplate, "id" | "sourceId" | "instructorId" | "createdAt">
): Promise<string> {
  const ref = doc(collection(db, "ClassTemplate"))
  await setDoc(ref, {
    id: ref.id,
    sourceId,
    instructorId,
    ...data,
    createdAt: serverTimestamp(),
  } as unknown as ClassTemplate)
  return ref.id
}

/** Get or create ClassTemplate, return templateId */
async function getOrCreateTemplate(
  sourceId: string,
  instructorId: string,
  scraped: ScrapedClass
): Promise<string> {
  const existing = await findTemplate(sourceId, scraped.title)
  if (existing) return existing

  const durationMin = scraped.durationMin ?? Math.round((scraped.endTime.getTime() - scraped.startTime.getTime()) / (60 * 1000))
  return createTemplate(sourceId, instructorId, {
    title: scraped.title,
    description: scraped.description ?? "",
    category: scraped.category ?? "workshop",
    durationMin,
    price: scraped.price,
    ...(scraped.url ? { url: scraped.url } : {}),
  })
}

/**
 * Stable session ID: same class at the same time → same document, no matter how many times
 * or on which machine the scraper runs. Keeps favorites (stored by session ID) working
 * across daily re-imports.
 */
function sessionDocId(templateId: string, startTime: Date): string {
  return `${templateId}_${startTime.toISOString().replace(/[:.]/g, "")}`
}

/** Create or overwrite a ClassSession */
async function upsertSession(
  sessionId: string,
  templateId: string,
  scraped: ScrapedClass
): Promise<void> {
  const ref = doc(db, "ClassSession", sessionId)
  // -1 = unknown (UI shows "Check page for availability")
  const capacity = scraped.capacity ?? -1
  const spotsLeft = scraped.spotsLeft ?? (capacity >= 0 ? capacity : -1)
  await setDoc(ref, {
    id: ref.id,
    templateId,
    startTime: scraped.startTime,
    endTime: scraped.endTime,
    capacity,
    spotsLeft,
    createdAt: serverTimestamp(),
  } as unknown as ClassSession)
}

/**
 * The scrape is the source of truth for a studio's upcoming calendar: delete any upcoming
 * session for this source that the scrape didn't produce (cancelled classes, old copies
 * written with the wrong time zone, classes the curation step now filters out).
 * Past sessions are left alone.
 */
async function removeStaleUpcomingSessions(sourceId: string, keepIds: Set<string>): Promise<number> {
  const templates = await getDocs(query(collection(db, "ClassTemplate"), where("sourceId", "==", sourceId)))
  const templateIds = templates.docs.map((d) => d.id)
  const now = new Date()
  const stale: ReturnType<typeof doc>[] = []
  for (let i = 0; i < templateIds.length; i += 30) {
    const chunk = templateIds.slice(i, i + 30)
    const snap = await getDocs(query(collection(db, "ClassSession"), where("templateId", "in", chunk)))
    for (const d of snap.docs) {
      const start = (d.data().startTime as { toDate(): Date }).toDate()
      if (start >= now && !keepIds.has(d.id)) stale.push(d.ref)
    }
  }
  for (let i = 0; i < stale.length; i += 500) {
    const batch = writeBatch(db)
    stale.slice(i, i + 500).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
  return stale.length
}

/**
 * Import scraped classes into Firebase.
 * Creates Source, Instructor, Template, Session as needed.
 */
export async function importToFirebase(
  classes: ScrapedClass[],
  /** Sources that were scraped successfully this run (even if every class was filtered out).
   *  Their upcoming sessions are replaced by this run's results. Defaults to sources in `classes`. */
  scrapedSources: Iterable<string> = classes.map((c) => c.sourceName)
): Promise<{ imported: number; removed: number; errors: string[] }> {
  const errors: string[] = []
  let imported = 0
  let removed = 0

  // Group by source
  const bySource = new Map<string, ScrapedClass[]>()
  for (const name of scrapedSources) bySource.set(name, [])
  for (const c of classes) {
    const list = bySource.get(c.sourceName) ?? []
    list.push(c)
    bySource.set(c.sourceName, list)
  }

  for (const [sourceName, sourceClasses] of bySource) {
    try {
      const address = sourceClasses[0]?.address
      const neighborhood = sourceClasses[0]?.neighborhood
      if (sourceClasses.length === 0) {
        // Everything from this source was filtered out — just clear its upcoming sessions
        const existing = await findSourceByName(sourceName)
        if (existing) removed += await removeStaleUpcomingSessions(existing.id, new Set())
        continue
      }
      const sourceId = await getOrCreateSource(sourceName, address, neighborhood)
      const instructorId = await getOrCreateInstructor(
        sourceId,
        sourceClasses[0]?.instructor
      )

      const written = new Set<string>()
      let sourceOk = true
      for (const scraped of sourceClasses) {
        try {
          const templateId = await getOrCreateTemplate(sourceId, instructorId, scraped)
          const sessionId = sessionDocId(templateId, scraped.startTime)
          if (written.has(sessionId)) continue // same class + time listed twice on the site
          await upsertSession(sessionId, templateId, scraped)
          written.add(sessionId)
          imported++
        } catch (err) {
          sourceOk = false
          errors.push(`${sourceName} / ${scraped.title}: ${String(err)}`)
        }
      }

      // Only prune when every write succeeded, so a flaky run never deletes good data
      if (sourceOk) removed += await removeStaleUpcomingSessions(sourceId, written)
    } catch (err) {
      errors.push(`${sourceName}: ${String(err)}`)
    }
  }

  return { imported, removed, errors }
}
