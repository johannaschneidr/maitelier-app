/**
 * One-off migration: fix incorrect Instagram handles in Firestore.
 * Run: npx tsx scripts/fix-instagram-handles.ts
 */
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { db } from "../lib/firebase"

const FIXES: Record<string, string> = {
  "Craft Society": "craft_soc",
  "Brooklyn Brainery": "bkbrains",
  "UrbanGlass": "urbanglass_nyc",
  "ResoBox": "resobox",
  "Brooklyn Craft Company": "brooklyncraftcompany",
}

async function run() {
  for (const [name, handle] of Object.entries(FIXES)) {
    const q = query(collection(db, "Source"), where("name", "==", name))
    const snap = await getDocs(q)
    if (snap.empty) {
      console.log(`  ✗ Not found: ${name}`)
      continue
    }
    for (const d of snap.docs) {
      await updateDoc(doc(db, "Source", d.id), { instagramHandle: handle })
      console.log(`  ✓ ${name} → @${handle}`)
    }
  }
  console.log("Done.")
}

run().catch(console.error)
