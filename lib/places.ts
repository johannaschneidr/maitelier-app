/**
 * Google Places API (v1) utility.
 * Server-side only — uses GOOGLE_PLACES_API_KEY from env.
 * Used by seed-studios script and studio page server components.
 */

const PLACES_BASE = "https://places.googleapis.com/v1"

export interface PlaceDetails {
  placeId: string
  name: string
  formattedAddress: string
  phone?: string
  website?: string
  /** Weekday description strings e.g. "Monday: 10:00 AM – 6:00 PM" */
  hours?: string[]
  coordinates?: { lat: number; lng: number }
  /** CDN photo URL (stable, no key required) */
  photoUrl?: string
}

/**
 * Search for a place by text query, biased to NYC.
 * Returns the top result or null if nothing found.
 */
export async function findPlace(query: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set")

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.regularOpeningHours",
        "places.photos",
        "places.location",
        "places.websiteUri",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      // Bias results to NYC metro area
      locationBias: {
        circle: {
          center: { latitude: 40.7128, longitude: -74.006 },
          radius: 50000,
        },
      },
      maxResultCount: 1,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Places API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const place = data.places?.[0]
  if (!place) return null

  let photoUrl: string | undefined
  if (place.photos?.[0]?.name) {
    photoUrl = await fetchPhotoUrl(place.photos[0].name, apiKey)
  }

  return {
    placeId: place.id,
    name: place.displayName?.text ?? "",
    formattedAddress: place.formattedAddress ?? "",
    phone: place.nationalPhoneNumber ?? undefined,
    website: place.websiteUri ?? undefined,
    hours: place.regularOpeningHours?.weekdayDescriptions ?? undefined,
    coordinates: place.location
      ? { lat: place.location.latitude, lng: place.location.longitude }
      : undefined,
    photoUrl,
  }
}

/**
 * Fetch a stable CDN photo URL from a Places photo resource name.
 * Uses skipHttpRedirect to get the photoUri directly (no API key in final URL).
 */
async function fetchPhotoUrl(
  photoName: string,
  apiKey: string
): Promise<string | undefined> {
  const url = `${PLACES_BASE}/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return undefined
  const data = await res.json()
  return data.photoUri ?? undefined
}
