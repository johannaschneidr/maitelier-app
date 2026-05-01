/**
 * Patches existing Firestore Source docs with the description field from sources.ts.
 * Matches on slug. Does not re-hit the Places API.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/update-source-descriptions.ts
 */

import { db } from "../lib/firebase"
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { getAllSources } from "./config/sources"

async function updateDescriptions() {
  const studios = getAllSources().filter((s) => s.description)
  console.log(`Updating descriptions for ${studios.length} studios...\n`)

  let updated = 0
  let missing = 0
  let errors = 0

  for (const studio of studios) {
    const q = query(collection(db, "Source"), where("slug", "==", studio.slug))
    const snap = await getDocs(q)

    if (snap.empty) {
      console.log(`  [skip] ${studio.name} — no Firestore doc found (run seed-studios first)`)
      missing++
      continue
    }

    try {
      const ref = doc(db, "Source", snap.docs[0].id)
      await updateDoc(ref, { description: studio.description })
      console.log(`  [ok]   ${studio.name}`)
      updated++
    } catch (err) {
      console.error(`  [err]  ${studio.name}: ${String(err)}`)
      errors++
    }
  }

  console.log(`\n─────────────────────────────`)
  console.log(`Updated: ${updated}`)
  console.log(`Missing: ${missing}`)
  console.log(`Errors:  ${errors}`)
  console.log(`─────────────────────────────`)
}

updateDescriptions().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
