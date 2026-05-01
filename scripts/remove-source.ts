/**
 * Remove a source and all its associated data from Firestore.
 * Usage: npx tsx scripts/remove-source.ts <sourceId>
 *
 * Deletes: ClassSession docs for those templates, ClassTemplate docs, Source doc.
 */

import { db } from "../lib/firebase"
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  deleteDoc,
} from "firebase/firestore"

async function removeSource(sourceId: string) {
  console.log(`Removing source: ${sourceId}`)

  // 1. Find all ClassTemplates for this source
  const templatesSnap = await getDocs(
    query(collection(db, "ClassTemplate"), where("sourceId", "==", sourceId))
  )
  const templateIds = templatesSnap.docs.map((d) => d.id)
  console.log(`  Found ${templateIds.length} ClassTemplate(s)`)

  // 2. Delete ClassSessions for those templates (chunk by 10 for Firestore 'in' limit)
  let sessionCount = 0
  for (let i = 0; i < templateIds.length; i += 10) {
    const chunk = templateIds.slice(i, i + 10)
    const sessionsSnap = await getDocs(
      query(collection(db, "ClassSession"), where("templateId", "in", chunk))
    )
    sessionCount += sessionsSnap.docs.length
    const batch = writeBatch(db)
    sessionsSnap.docs.forEach((d) => batch.delete(d.ref))
    if (sessionsSnap.docs.length > 0) await batch.commit()
  }
  console.log(`  Deleted ${sessionCount} ClassSession(s)`)

  // 3. Delete ClassTemplates
  if (templatesSnap.docs.length > 0) {
    const batch = writeBatch(db)
    templatesSnap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  console.log(`  Deleted ${templateIds.length} ClassTemplate(s)`)

  // 4. Delete Source doc
  await deleteDoc(doc(db, "Source", sourceId))
  console.log(`  Deleted Source doc`)

  console.log(`Done.`)
}

const sourceId = process.argv[2]
if (!sourceId) {
  console.error("Usage: npx tsx scripts/remove-source.ts <sourceId>")
  process.exit(1)
}

removeSource(sourceId).catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
