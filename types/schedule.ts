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
}
