import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  limit
} from "firebase/firestore"
import { db } from "./firebase"
import type { ClassSession, ClassTemplate, StudioInstructor, Source, UserSavedClass } from "@/types/db"

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof value === "object" && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate()
  }
  return new Date()
}

function docToSession(id: string, data: Record<string, unknown>): ClassSession {
  return {
    id,
    templateId: (data.templateId as string) ?? "",
    startTime: toDate(data.startTime),
    endTime: toDate(data.endTime),
    capacity: (data.capacity as number) ?? 0,
    spotsLeft: (data.spotsLeft as number) ?? 0,
    createdAt: toDate(data.createdAt)
  }
}

export async function getUpcomingSessions(upcomingOnly = true): Promise<ClassSession[]> {
  const q = upcomingOnly
    ? query(
        collection(db, "ClassSession"),
        where("startTime", ">=", new Date()),
        orderBy("startTime", "asc"),
        limit(50)
      )
    : query(
        collection(db, "ClassSession"),
        orderBy("startTime", "asc"),
        limit(50)
      )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToSession(d.id, d.data() as Record<string, unknown>))
}

export async function getPastSessions(limitCount = 50): Promise<ClassSession[]> {
  const q = query(
    collection(db, "ClassSession"),
    where("startTime", "<", new Date()),
    orderBy("startTime", "desc"),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => docToSession(d.id, d.data() as Record<string, unknown>))
}

export async function getSessionById(id: string): Promise<ClassSession | null> {
  const sessionRef = doc(db, "ClassSession", id)
  const snap = await getDoc(sessionRef)
  if (!snap.exists()) return null
  return docToSession(snap.id, snap.data() as Record<string, unknown>)
}

export async function getTemplates(): Promise<ClassTemplate[]> {
  const snap = await getDocs(
    query(collection(db, "ClassTemplate"), orderBy("createdAt", "desc"))
  )
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      sourceId: (data.sourceId as string) ?? "",
      instructorId: data.instructorId as string | undefined,
      title: (data.title as string) ?? "",
      description: (data.description as string) ?? "",
      category: (data.category as string) ?? "",
      durationMin: (data.durationMin as number) ?? 0,
      price: (data.price as number) ?? 0,
      createdAt: toDate(data.createdAt)
    }
  })
}

export async function getInstructors(): Promise<StudioInstructor[]> {
  const snap = await getDocs(
    query(collection(db, "StudioInstructor"), orderBy("name", "asc"))
  )
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      sourceId: (data.sourceId as string) ?? "",
      name: (data.name as string) ?? "",
      bio: data.bio as string | undefined,
      imageUrl: data.imageUrl as string | undefined,
      createdAt: toDate(data.createdAt)
    }
  })
}

export async function getSources(): Promise<Source[]> {
  const snap = await getDocs(collection(db, "Source"))
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      name: (data.name as string) ?? "",
      type: (data.type as Source["type"]) ?? "independent",
      neighborhood: data.neighborhood as string | undefined,
      address: data.address as string | undefined,
      createdAt: toDate(data.createdAt)
    }
  })
}

export async function getSavedClassesByUserId(userId: string): Promise<UserSavedClass[]> {
  const q = query(
    collection(db, "UserSavedClass"),
    where("userId", "==", userId)
  )
  const snap = await getDocs(q)
  const list = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      userId: (data.userId as string) ?? "",
      sessionId: (data.sessionId as string) ?? "",
      savedAt: toDate(data.savedAt)
    }
  })
  list.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime())
  return list
}
