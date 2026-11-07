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
    /** Hero photo URL (first Places API photo) */
    photoUrl?: string
    /** Gallery photo URLs from Places API (hero first, up to 5) */
    photoUrls?: string[]
    /** Short editorial description for SEO and display */
    description?: string
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
    /**
     * Optional class facts (AEO facts block). Not written by scrapers yet —
     * add them by hand in Firestore and they appear on the class page.
     */
    level?: "beginner" | "all-levels" | "intermediate" | "advanced"
    /** e.g. "2–3 bowls or mugs" */
    whatYouMake?: string
    takeHome?: "same-day" | "fired-later" | "no"
    /** e.g. "3 weeks" — shown when takeHome is "fired-later" */
    pickupAfter?: string
    materialsIncluded?: boolean
    byob?: boolean
    minAge?: number
  }
  
  export type ClassSession = {
    id: string
    templateId: string
    startTime: Date
    endTime: Date
    capacity: number
    spotsLeft: number
    createdAt: Date
    /** When a scrape last confirmed this session (lastCheckedAt, else createdAt). Undefined if unknown. */
    lastCheckedAt?: Date
  }
  
  export type UserSavedClass = {
    id: string
    userId: string
    sessionId: string
    savedAt: Date
  }
  