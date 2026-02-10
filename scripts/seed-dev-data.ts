/**
 * Dev/test seed: rich data for UI development.
 * Run with: npx tsx scripts/seed-dev-data.ts
 *
 * Creates multiple sources, instructors, templates, and sessions
 * spread over the next 2–3 weeks. Use this instead of seed.ts
 * when building out the UI; replace with live scraping later.
 */

import { db } from "../lib/firebase"
import { collection, doc, setDoc, serverTimestamp, getDocs, writeBatch } from "firebase/firestore"
import type { Source, StudioInstructor, ClassTemplate, ClassSession, UserSavedClass } from "../types/db"

/** Delete all docs in a collection (so dev seed replaces old data and every source has neighborhood). */
async function clearCollection(collectionName: string) {
  const snap = await getDocs(collection(db, collectionName))
  const batchSize = 500
  for (let i = 0; i < snap.docs.length; i += batchSize) {
    const batch = writeBatch(db)
    snap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
}

function createSource(
  name: string,
  type: Source["type"]
): { ref: ReturnType<typeof doc>; id: string } {
  const ref = doc(collection(db, "Source"))
  return { ref, id: ref.id }
}

function createInstructor(
  sourceId: string,
  name: string,
  bio: string,
  imageUrl = ""
): { ref: ReturnType<typeof doc>; id: string } {
  const ref = doc(collection(db, "StudioInstructor"))
  return { ref, id: ref.id }
}

function createTemplate(
  sourceId: string,
  instructorId: string,
  data: Omit<ClassTemplate, "id" | "sourceId" | "instructorId" | "createdAt">
): { ref: ReturnType<typeof doc>; id: string } {
  const ref = doc(collection(db, "ClassTemplate"))
  return { ref, id: ref.id }
}

function createSession(
  templateId: string,
  start: Date,
  end: Date,
  capacity: number,
  spotsLeft: number
): { ref: ReturnType<typeof doc>; id: string } {
  const ref = doc(collection(db, "ClassSession"))
  return { ref, id: ref.id }
}

async function seedDevData() {
  console.log("Seeding dev data for UI...")

  console.log("Clearing existing dev data...")
  await clearCollection("UserSavedClass")
  await clearCollection("ClassSession")
  await clearCollection("ClassTemplate")
  await clearCollection("StudioInstructor")
  await clearCollection("Source")

  const sources: { ref: ReturnType<typeof doc>; id: string }[] = []
  const instructors: { ref: ReturnType<typeof doc>; id: string; sourceId: string }[] = []
  const templates: { ref: ReturnType<typeof doc>; id: string; sourceId: string; instructorId: string }[] = []

  // ---------- Sources ----------
  const s1 = createSource("Brooklyn Clay Studio", "studio")
  const s2 = createSource("CraftPass Partner", "platform")
  const s3 = createSource("Makers Collective", "independent")
  sources.push(s1, s2, s3)

  await setDoc(s1.ref, {
    id: s1.id,
    name: "Brooklyn Clay Studio",
    type: "studio",
    neighborhood: "Williamsburg",
    createdAt: serverTimestamp()
  } as unknown as Source)
  await setDoc(s2.ref, {
    id: s2.id,
    name: "CraftPass Partner",
    type: "platform",
    neighborhood: "DUMBO",
    createdAt: serverTimestamp()
  } as unknown as Source)
  await setDoc(s3.ref, {
    id: s3.id,
    name: "Makers Collective",
    type: "independent",
    neighborhood: "Gowanus",
    createdAt: serverTimestamp()
  } as unknown as Source)

  // ---------- Instructors ----------
  const instr = [
    { sourceId: s1.id, name: "Jamie Clay", bio: "Ceramic artist and instructor with 10+ years experience." },
    { sourceId: s1.id, name: "Morgan Lee", bio: "Wheel throwing and hand-building specialist." },
    { sourceId: s2.id, name: "Alex Chen", bio: "Woodworking and furniture design." },
    { sourceId: s2.id, name: "Sam Rivera", bio: "Watercolor and mixed media." },
    { sourceId: s3.id, name: "Jordan Blake", bio: "Jewelry and metalsmithing." }
  ]
  for (const i of instr) {
    const ref = doc(collection(db, "StudioInstructor"))
    instructors.push({ ref, id: ref.id, sourceId: i.sourceId })
    await setDoc(ref, {
      id: ref.id,
      sourceId: i.sourceId,
      name: i.name,
      bio: i.bio,
      imageUrl: "",
      createdAt: serverTimestamp()
    } as unknown as StudioInstructor)
  }

  // ---------- ClassTemplates ----------
  const templateDefs = [
    { sourceId: s1.id, instructorId: instructors[0].id, title: "Wheel Throwing Basics", description: "Intro to wheel throwing techniques.", category: "ceramics", durationMin: 120, price: 65 },
    { sourceId: s1.id, instructorId: instructors[0].id, title: "Hand Building Workshop", description: "Pinch, coil, and slab techniques.", category: "ceramics", durationMin: 90, price: 45 },
    { sourceId: s1.id, instructorId: instructors[1].id, title: "Glazing & Firing", description: "Learn glazing and kiln basics.", category: "ceramics", durationMin: 180, price: 85 },
    { sourceId: s2.id, instructorId: instructors[2].id, title: "Intro to Woodworking", description: "Safety, tools, and your first project.", category: "woodworking", durationMin: 180, price: 120 },
    { sourceId: s2.id, instructorId: instructors[2].id, title: "Cutting Board Workshop", description: "Make a hardwood cutting board.", category: "woodworking", durationMin: 150, price: 95 },
    { sourceId: s2.id, instructorId: instructors[3].id, title: "Watercolor Basics", description: "Materials, washes, and simple compositions.", category: "painting", durationMin: 120, price: 55 },
    { sourceId: s2.id, instructorId: instructors[3].id, title: "Abstract Mixed Media", description: "Combine paint, collage, and texture.", category: "painting", durationMin: 90, price: 50 },
    { sourceId: s3.id, instructorId: instructors[4].id, title: "Silver Ring Making", description: "Fabricate a sterling silver ring.", category: "jewelry", durationMin: 180, price: 140 },
    { sourceId: s3.id, instructorId: instructors[4].id, title: "Wire Wrapping", description: "Intro to wire wrapping stones and beads.", category: "jewelry", durationMin: 90, price: 45 }
  ]
  for (const t of templateDefs) {
    const ref = doc(collection(db, "ClassTemplate"))
    templates.push({ ref, id: ref.id, sourceId: t.sourceId, instructorId: t.instructorId })
    await setDoc(ref, {
      id: ref.id,
      sourceId: t.sourceId,
      instructorId: t.instructorId,
      title: t.title,
      description: t.description,
      category: t.category,
      durationMin: t.durationMin,
      price: t.price,
      createdAt: serverTimestamp()
    } as unknown as ClassTemplate)
  }

  // ---------- ClassSessions: next 2–3 weeks, varied times and availability ----------
  const now = new Date()
  const day = (offset: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const sessionsToCreate: { templateId: string; start: Date; end: Date; capacity: number; spotsLeft: number }[] = []

  // Helper: add a session at hour on dayOffset
  const add = (templateIndex: number, dayOffset: number, startHour: number, durationMin: number, capacity: number, spotsLeft: number) => {
    const start = new Date(day(dayOffset))
    start.setHours(startHour, 0, 0, 0)
    const end = new Date(start.getTime() + durationMin * 60 * 1000)
    sessionsToCreate.push({
      templateId: templates[templateIndex].id,
      start,
      end,
      capacity,
      spotsLeft
    })
  }

  // Week 1
  add(0, 1, 10, 120, 10, 10)   // Wheel Throwing, tomorrow 10am
  add(0, 1, 18, 120, 10, 4)    // Wheel Throwing, tomorrow 6pm — almost full
  add(1, 2, 14, 90, 8, 8)      // Hand Building
  add(3, 2, 9, 180, 6, 2)      // Intro Woodworking — almost full
  add(5, 3, 10, 120, 12, 12)   // Watercolor
  add(7, 3, 18, 90, 10, 10)    // Abstract Mixed Media
  add(0, 4, 10, 120, 10, 10)   // Wheel Throwing Fri
  add(4, 4, 14, 150, 8, 0)     // Cutting Board — full
  add(8, 5, 10, 180, 6, 5)     // Silver Ring Sat
  add(2, 5, 14, 180, 8, 8)     // Glazing & Firing
  add(6, 6, 11, 90, 10, 10)    // Abstract Mixed Media Sun
  add(1, 6, 15, 90, 8, 3)      // Hand Building — low spots

  // Week 2
  add(0, 8, 10, 120, 10, 10)
  add(5, 8, 18, 120, 12, 12)
  add(3, 9, 9, 180, 6, 6)
  add(8, 9, 10, 180, 6, 4)
  add(2, 10, 10, 180, 8, 8)
  add(4, 11, 14, 150, 8, 7)
  add(7, 12, 10, 90, 10, 10)
  add(0, 13, 18, 120, 10, 10)
  add(5, 14, 10, 120, 12, 12)
  add(8, 15, 10, 180, 6, 6)
  add(1, 15, 14, 90, 8, 8)

  // Week 3
  add(3, 16, 9, 180, 6, 6)
  add(6, 17, 18, 90, 10, 10)
  add(0, 18, 10, 120, 10, 10)
  add(4, 19, 14, 150, 8, 8)
  add(8, 20, 10, 180, 6, 6)
  add(2, 21, 14, 180, 8, 8)

  const sessionIds: string[] = []
  for (const s of sessionsToCreate) {
    const ref = doc(collection(db, "ClassSession"))
    sessionIds.push(ref.id)
    await setDoc(ref, {
      id: ref.id,
      templateId: s.templateId,
      startTime: s.start,
      endTime: s.end,
      capacity: s.capacity,
      spotsLeft: s.spotsLeft,
      createdAt: serverTimestamp()
    } as unknown as ClassSession)
  }

  // ---------- UserSavedClass (dev user saves a few sessions) ----------
  const DEV_USER_ID = "dev-user"
  const savedSessionIds = sessionIds.slice(0, 5)
  for (const sessionId of savedSessionIds) {
    const ref = doc(collection(db, "UserSavedClass"))
    await setDoc(ref, {
      id: ref.id,
      userId: DEV_USER_ID,
      sessionId,
      savedAt: serverTimestamp()
    } as unknown as UserSavedClass)
  }

  console.log(`✅ Dev seed complete: ${sources.length} sources, ${instructors.length} instructors, ${templates.length} templates, ${sessionsToCreate.length} sessions, ${savedSessionIds.length} saved classes`)
}

seedDevData().catch((err) => {
  console.error("❌ Error seeding dev data:", err)
})
