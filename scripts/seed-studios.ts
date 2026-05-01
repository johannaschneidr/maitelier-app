/**
 * One-time script: seeds Firestore Source docs for all 20 priority studios
 * using the Google Places API for address, coordinates, phone, hours, and photo.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/seed-studios.ts
 *
 * Safe to re-run — uses slug to find existing docs and updates in place.
 */

import { db } from "../lib/firebase"
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore"
import { findPlace } from "../lib/places"
import { getAllSources } from "./config/sources"
import type { Source } from "../types/db"

const PLACES_DELAY_MS = 300 // Stay well under Places API rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findExistingSource(slug: string): Promise<string | null> {
  const q = query(collection(db, "Source"), where("slug", "==", slug))
  const snap = await getDocs(q)
  if (!snap.empty) return snap.docs[0].id
  // Also check by name for legacy docs without slug
  return null
}

async function seedStudios() {
  const studios = getAllSources()
  console.log(`Seeding ${studios.length} studios into Firestore...\n`)

  let created = 0
  let updated = 0
  let errors = 0

  for (const studio of studios) {
    process.stdout.write(`[${studio.name}] `)

    // Look up Places data
    let placeDetails = null
    try {
      placeDetails = await findPlace(studio.placeSearchQuery)
      if (placeDetails) {
        process.stdout.write(`→ found (${placeDetails.formattedAddress})\n`)
      } else {
        process.stdout.write(`→ no place found\n`)
      }
    } catch (err) {
      process.stdout.write(`→ Places API error: ${String(err)}\n`)
      errors++
    }

    await sleep(PLACES_DELAY_MS)

    // Build the Source document
    const sourceData: Omit<Source, "id"> = {
      name: studio.name,
      slug: studio.slug,
      type: "studio",
      neighborhood: studio.neighborhood,
      address: placeDetails?.formattedAddress ?? studio.address,
      website: studio.url ?? undefined,
      bookingPlatform: studio.platform,
      bookingUrl: studio.bookingUrl,
      instagramHandle: studio.instagramHandle,
      placeId: placeDetails?.placeId,
      phone: placeDetails?.phone,
      coordinates: placeDetails?.coordinates,
      photoUrl: placeDetails?.photoUrl,
      photoUrls: placeDetails?.photoUrls,
      description: studio.description,
      createdAt: new Date(),
    }

    // Strip undefined values (Firestore doesn't accept them)
    const clean = Object.fromEntries(
      Object.entries(sourceData).filter(([, v]) => v !== undefined)
    ) as Omit<Source, "id">

    try {
      const existingId = await findExistingSource(studio.slug)

      if (existingId) {
        const ref = doc(db, "Source", existingId)
        await setDoc(ref, { ...clean, id: existingId }, { merge: true })
        console.log(`  ✓ Updated (${existingId})`)
        updated++
      } else {
        const ref = doc(collection(db, "Source"))
        await setDoc(ref, { ...clean, id: ref.id })
        console.log(`  ✓ Created (${ref.id})`)
        created++
      }
    } catch (err) {
      console.error(`  ✗ Firestore error: ${String(err)}`)
      errors++
    }
  }

  console.log(`\n─────────────────────────────`)
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Errors:  ${errors}`)
  console.log(`─────────────────────────────`)
}

seedStudios().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
