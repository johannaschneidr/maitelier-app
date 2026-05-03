/**
 * Push expanded studio descriptions from sources.ts into Firestore.
 * Run: npx tsx scripts/update-studio-descriptions.ts
 */
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { SOURCES } from "./config/sources"

async function run() {
  let updated = 0
  let skipped = 0

  for (const source of SOURCES) {
    if (!source.description) { skipped++; continue }

    const q = query(collection(db, "Source"), where("name", "==", source.name))
    const snap = await getDocs(q)

    if (snap.empty) {
      console.log(`  ✗ Not found in Firestore: ${source.name}`)
      skipped++
      continue
    }

    for (const d of snap.docs) {
      await updateDoc(doc(db, "Source", d.id), { description: source.description })
      console.log(`  ✓ ${source.name}`)
      updated++
    }
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}`)
}

run().catch(console.error)
