/**
 * Fetches up to 5 Google Places photos per studio and writes them to Firestore.
 * Safe to re-run — overwrites photoUrl and photoUrls in place.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/update-studio-photos.ts
 *
 * To update a single studio:
 *   npx tsx --env-file=.env.local scripts/update-studio-photos.ts brooklyn-glass
 */

import { db } from "../lib/firebase"
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { findPlace } from "../lib/places"
import { getAllSources } from "./config/sources"

const PLACES_DELAY_MS = 500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function updatePhotos() {
  const slugFilter = process.argv[2]
  let studios = getAllSources()
  if (slugFilter) {
    studios = studios.filter((s) => s.slug === slugFilter)
    if (studios.length === 0) {
      console.error(`No studio found with slug "${slugFilter}"`)
      process.exit(1)
    }
  }

  console.log(`Updating photos for ${studios.length} studio(s)...\n`)

  let updated = 0
  let missing = 0
  let errors = 0

  for (const studio of studios) {
    process.stdout.write(`[${studio.name}] fetching Places photos... `)

    let photoUrl: string | undefined
    let photoUrls: string[] = []

    try {
      const place = await findPlace(studio.placeSearchQuery)
      if (place) {
        photoUrl = place.photoUrl
        photoUrls = place.photoUrls
        process.stdout.write(`${photoUrls.length} photo(s) found\n`)
      } else {
        process.stdout.write(`no place found\n`)
      }
    } catch (err) {
      process.stdout.write(`Places API error: ${String(err)}\n`)
      errors++
      await sleep(PLACES_DELAY_MS)
      continue
    }

    await sleep(PLACES_DELAY_MS)

    const q = query(collection(db, "Source"), where("slug", "==", studio.slug))
    const snap = await getDocs(q)

    if (snap.empty) {
      console.log(`  [skip] no Firestore doc found (run seed:studios first)`)
      missing++
      continue
    }

    try {
      const ref = doc(db, "Source", snap.docs[0].id)
      const updates: Record<string, unknown> = { photoUrls }
      if (photoUrl) updates.photoUrl = photoUrl
      await updateDoc(ref, updates)
      console.log(`  [ok]   wrote ${photoUrls.length} URL(s)`)
      updated++
    } catch (err) {
      console.error(`  [err]  ${String(err)}`)
      errors++
    }
  }

  console.log(`\n─────────────────────────────`)
  console.log(`Updated: ${updated}`)
  console.log(`Missing: ${missing}`)
  console.log(`Errors:  ${errors}`)
  console.log(`─────────────────────────────`)
}

updatePhotos().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
