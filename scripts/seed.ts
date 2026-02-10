import { db } from "../lib/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import {
  Source,
  StudioInstructor,
  ClassTemplate,
  ClassSession
} from "../types/db"

async function seed() {
  console.log("Seeding Firestore...")

  // ---------- Source ----------
  const sourceRef = doc(collection(db, "Source"))
  await setDoc(sourceRef, {
    id: sourceRef.id,
    name: "Manual Seed",
    type: "independent",
    createdAt: serverTimestamp()
  } as unknown as Source)

  // ---------- StudioInstructor ----------
  const instructorRef = doc(collection(db, "StudioInstructor"))
  await setDoc(instructorRef, {
    id: instructorRef.id,
    sourceId: sourceRef.id,
    name: "Jamie Clay",
    bio: "Ceramic artist and instructor",
    imageUrl: "",
    createdAt: serverTimestamp()
  } as unknown as StudioInstructor)

  // ---------- ClassTemplate ----------
  const templateRef = doc(collection(db, "ClassTemplate"))
  await setDoc(templateRef, {
    id: templateRef.id,
    sourceId: sourceRef.id,
    instructorId: instructorRef.id,
    title: "Wheel Throwing Basics",
    description: "Intro to wheel throwing techniques",
    category: "ceramics",
    durationMin: 120,
    price: 50,
    createdAt: serverTimestamp()
  } as unknown as ClassTemplate)

  // ---------- ClassSession ----------
  const sessionRef = doc(collection(db, "ClassSession"))
  await setDoc(sessionRef, {
    id: sessionRef.id,
    templateId: templateRef.id,
    startTime: new Date("2026-02-10T18:00:00"),
    endTime: new Date("2026-02-10T20:00:00"),
    capacity: 10,
    spotsLeft: 10,
    createdAt: serverTimestamp()
  } as unknown as ClassSession)

  console.log("✅ Seed complete")
}

seed().catch((err) => {
  console.error("❌ Error seeding Firestore:", err)
})
