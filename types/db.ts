// types/db.ts

export type Source = {
    id: string
    name: string
    type: "studio" | "platform" | "independent"
    /** Neighborhood (e.g. "Williamsburg") for display and proximity indicator. */
    neighborhood?: string
    /** Raw address from scraping; used later for geocoding → neighborhood/location. */
    address?: string
    createdAt: Date
  }
  
  export type StudioInstructor = {
    id: string
    sourceId: string
    name: string
    bio?: string
    imageUrl?: string
    createdAt: Date
  }
  
  export type ClassTemplate = {
    id: string
    sourceId: string
    instructorId?: string
    title: string
    description: string
    category: string
    durationMin: number
    price: number
    createdAt: Date
  }
  
  export type ClassSession = {
    id: string
    templateId: string
    startTime: Date
    endTime: Date
    capacity: number
    spotsLeft: number
    createdAt: Date
  }
  
  export type UserSavedClass = {
    id: string
    userId: string
    sessionId: string
    savedAt: Date
  }
  