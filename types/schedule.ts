/**
 * Serializable schedule item for passing from server to client.
 * Dates are ISO strings so they survive serialization.
 */
export type ScheduleItem = {
  session: {
    id: string
    templateId: string
    startTime: string
    endTime: string
    capacity: number
    spotsLeft: number
  }
  template: {
    id: string
    title: string
    category: string
    durationMin: number
    price: number
  }
  hostName: string
  /** Studio neighborhood for proximity/location display. */
  neighborhood?: string
  /** Venue address */
  address?: string
  /** Studio slug for linking to /studios/[slug] */
  sourceSlug?: string
  /** Direct booking URL for this specific class */
  classUrl?: string
  /** Studio booking/website URL — fallback when no per-class URL is available */
  studioBookingUrl?: string
}
