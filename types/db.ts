// types/db.ts

export type Source = {
    id: string
    name: string
    slug?: string
    type: "studio" | "platform" | "independent"
    /** Neighborhood (e.g. "Williamsburg") for display and proximity indicator. */
    neighborhood?: string
    /** Full address */
    address?: string
    /** Main website URL */
    website?: string
    /** Direct URL to booking/schedule page */
    bookingUrl?: string
    /** Booking platform used by this studio */
    bookingPlatform?: string
    /** Instagram handle without @ */
    instagramHandle?: string
    /** Google Places ID */
    placeId?: string
    /** Phone number */
    phone?: string
    /** GPS coordinates */
    coordinates?: { lat: number; lng: number }
    /** Photo URL from Places API */
    photoUrl?: string
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
    /** Direct booking URL for this specific class */
    url?: string
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
  