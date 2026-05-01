/**
 * Google Places API (v1) utility.
 * Server-side only — uses GOOGLE_PLACES_API_KEY from env.
 * Used by seed-studios script and studio page server components.
 */

const PLACES_BASE = "https://places.googleapis.com/v1"

const MAX_GALLERY_PHOTOS = 5

export interface PlaceDetails {
  placeId: string
  name: string
  formattedAddress: string
  phone?: string
  website?: string
  /** Weekday description strings e.g. "Monday: 10:00 AM – 6:00 PM" */
  hours?: string[]
  coordinates?: { lat: number; lng: number }
  /** First photo — used as hero */
  photoUrl?: string
  /** All resolved photo URLs (hero first), up to MAX_GALLERY_PHOTOS */
  photoUrls: string[]
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

  const photoNames: string[] = (place.photos ?? [])
    .slice(0, MAX_GALLERY_PHOTOS)
    .map((p: { name: string }) => p.name)
    .filter(Boolean)

  const photoUrls = (
    await Promise.all(photoNames.map((name) => fetchPhotoUrl(name, apiKey)))
  ).filter((u): u is string => !!u)

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
    photoUrl: photoUrls[0],
    photoUrls,
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
  const url = `${PLACES_BASE}/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return undefined
  const data = await res.json()
  return data.photoUri ?? undefined
}
