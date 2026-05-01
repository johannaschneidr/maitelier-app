/**
 * Meetup group events scraper.
 * Parses __NEXT_DATA__ / __APOLLO_STATE__ for structured event data.
 */
import type { ScrapedClass } from "../../types/scraped"
import { fetchWithDelay, inferNeighborhoodFromAddress } from "./utils"
import { getSourcesByPlatform } from "../config/sources"

interface MeetupEvent {
  __typename?: string
  id?: string
  title?: string
  eventUrl?: string
  description?: string
  dateTime?: string
  endTime?: string
  feeSettings?: { amount?: number; currency?: string } | null
  group?: { __ref?: string }
  venue?: { __ref?: string }
  isOnline?: boolean
}

interface MeetupGroup {
  __typename?: string
  id?: string
  urlname?: string
}

interface MeetupVenue {
  __typename?: string
  id?: string
  name?: string
  address?: string
  city?: string
  state?: string
  country?: string
}

type ApolloState = Record<
  string,
  MeetupEvent | MeetupGroup | MeetupVenue | { __ref?: string } | unknown
>

function resolveRef(apollo: ApolloState, ref: string): MeetupVenue | MeetupGroup | null {
  const obj = apollo[ref]
  return obj && typeof obj === "object" && !("__ref" in obj) ? (obj as MeetupVenue | MeetupGroup) : null
}

function formatAddress(venue: MeetupVenue | null): string | undefined {
  if (!venue) return undefined
  const parts = [venue.address, venue.city, venue.state].filter(Boolean)
  if (parts.length === 0) return undefined
  const country = venue.country ? venue.country.toUpperCase() : ""
  return country ? `${parts.join(", ")}, ${country}` : parts.join(", ")
}

async function scrapeMeetupSource(
  sourceName: string,
  url: string
): Promise<ScrapedClass[]> {
  const html = await fetchWithDelay(url)
  const classes: ScrapedClass[] = []

  const groupMatch = url.match(/meetup\.com\/([^/]+)/)
  const groupSlug = groupMatch?.[1] || ""

  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) {
    console.warn(`No __NEXT_DATA__ found for ${url}`)
    return classes
  }

  let data: { props?: { pageProps?: { __APOLLO_STATE__?: ApolloState } } }
  try {
    data = JSON.parse(match[1])
  } catch {
    return classes
  }

  const apollo = data.props?.pageProps?.__APOLLO_STATE__
  if (!apollo) return classes

  // Find the group for this page (by urlname)
  let targetGroupId: string | null = null
  for (const key of Object.keys(apollo)) {
    if (key.startsWith("Group:")) {
      const group = apollo[key] as MeetupGroup
      if (group?.urlname === groupSlug) {
        targetGroupId = key
        break
      }
    }
  }

  // Iterate Event objects, keep only those from our group
  for (const key of Object.keys(apollo)) {
    if (!key.startsWith("Event:")) continue
    const ev = apollo[key] as MeetupEvent
    if (!ev || ev.__typename !== "Event" || !ev.title) continue
    if (targetGroupId && ev.group?.__ref !== targetGroupId) continue

    const start = ev.dateTime ? new Date(ev.dateTime) : new Date()
    const end = ev.endTime ? new Date(ev.endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const price = ev.feeSettings?.amount ?? 0

    let address: string | undefined
    let neighborhood: string | undefined
    if (ev.venue?.__ref) {
      const venue = resolveRef(apollo, ev.venue.__ref) as MeetupVenue | null
      address = formatAddress(venue)
      neighborhood = inferNeighborhoodFromAddress(venue?.address, venue?.name)
    }

    classes.push({
      sourceName,
      title: ev.title,
      startTime: start,
      endTime: end,
      price,
      description: ev.description,
      url: ev.eventUrl,
      externalId: ev.id,
      category: ev.isOnline ? "online" : undefined,
      address,
      neighborhood,
    })
  }

  return classes
}

export async function scrapeMeetup(): Promise<ScrapedClass[]> {
  const sources = getSourcesByPlatform("meetup").filter((s) => s.url)
  const all: ScrapedClass[] = []
  for (const src of sources) {
    if (!src.url) continue
    try {
      const classes = await scrapeMeetupSource(src.name, src.url)
      all.push(...classes)
    } catch (err) {
      console.error(`Meetup scrape failed for ${src.name}:`, err)
    }
  }
  return all
}
