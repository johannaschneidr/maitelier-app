import { getUpcomingSessions, getPastSessions, getTemplates, getSources } from "@/lib/queries"
import { ScheduleView } from "@/app/components/ScheduleView"
import type { ScheduleItem } from "@/types/schedule"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://maitelier.com"

function buildItems(
  sessions: Awaited<ReturnType<typeof getUpcomingSessions>>,
  templateById: Map<string, Awaited<ReturnType<typeof getTemplates>>[number]>,
  sourceById: Map<string, Awaited<ReturnType<typeof getSources>>[number]>
): ScheduleItem[] {
  return sessions
    .map((session) => {
      const template = templateById.get(session.templateId)
      if (!template) return null
      const source = sourceById.get(template.sourceId)
      const item: ScheduleItem = {
        session: {
          id: session.id,
          templateId: session.templateId,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime.toISOString(),
          capacity: session.capacity,
          spotsLeft: session.spotsLeft
        },
        template: {
          id: template.id,
          title: template.title,
          category: template.category,
          durationMin: template.durationMin,
          price: template.price
        },
        hostName: source?.name ?? "Host"
      }
      if (source?.neighborhood) item.neighborhood = source.neighborhood
      if (source?.address) item.address = source.address
      if (source?.slug) item.sourceSlug = source.slug
      if (template.url) item.classUrl = template.url
      const externalUrl = source?.bookingUrl ?? source?.website
      if (externalUrl) item.studioBookingUrl = externalUrl
      return item
    })
    .filter((x): x is ScheduleItem => x !== null)
}

function buildEventJsonLd(items: ScheduleItem[]) {
  return items.map((item) => {
    const bookUrl = item.classUrl ?? item.studioBookingUrl
    const addressParts = item.address?.split(",") ?? []
    const event: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: item.template.title,
      startDate: item.session.startTime,
      endDate: item.session.endTime,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: item.hostName,
        address: {
          "@type": "PostalAddress",
          ...(addressParts[0] && { streetAddress: addressParts[0].trim() }),
          ...(addressParts[1] && { addressLocality: addressParts[1].trim() }),
          addressRegion: "NY",
          addressCountry: "US",
        },
      },
      organizer: {
        "@type": "Organization",
        name: item.hostName,
        ...(item.sourceSlug && { url: `${SITE_URL}/studios/${item.sourceSlug}` }),
      },
    }
    if (item.template.price > 0 && bookUrl) {
      event.offers = {
        "@type": "Offer",
        price: item.template.price.toString(),
        priceCurrency: "USD",
        availability: item.session.spotsLeft === 0
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
        url: bookUrl,
      }
    } else if (bookUrl) {
      event.offers = {
        "@type": "Offer",
        url: bookUrl,
        availability: item.session.spotsLeft === 0
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      }
    }
    return event
  })
}

export default async function Home() {
  const [sessions, pastSessions, templates, sources] = await Promise.all([
    getUpcomingSessions(),
    getPastSessions(),
    getTemplates(),
    getSources()
  ])
  const templateById = new Map(templates.map((t) => [t.id, t]))
  const sourceById = new Map(sources.map((s) => [s.id, s]))

  const items = buildItems(sessions, templateById, sourceById)
  const pastItems = buildItems(pastSessions, templateById, sourceById)
  const eventJsonLd = buildEventJsonLd(items)

  return (
    <main className="min-h-screen bg-claret p-6 md:p-10">
      {/* Event structured data for search engines */}
      {eventJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}

      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="font-display italic text-5xl font-normal text-cream leading-tight">
            Find creative classes in New York City that fit your schedule.
          </h1>
        </header>

        {items.length === 0 ? (
          <p className="text-cream-soft">
            No upcoming sessions. Check back later or run the dev seed.
          </p>
        ) : (
          <>
            {/* SSR content for crawlers — visually hidden, fully readable by search engines */}
            <div className="sr-only">
              {items.map((item) => (
                <article key={item.session.id}>
                  <h2>{item.template.title}</h2>
                  <p>
                    {item.template.category} class at {item.hostName}
                    {item.neighborhood ? `, ${item.neighborhood}` : ""}, New York City
                  </p>
                  <time dateTime={item.session.startTime}>
                    {new Date(item.session.startTime).toLocaleString("en-US", {
                      weekday: "long", month: "long", day: "numeric",
                      hour: "numeric", minute: "2-digit",
                    })}
                  </time>
                  {item.template.price > 0 && <p>Price: ${item.template.price}</p>}
                  {item.template.durationMin > 0 && <p>Duration: {item.template.durationMin} minutes</p>}
                  {(item.classUrl ?? item.studioBookingUrl) && (
                    <a href={item.classUrl ?? item.studioBookingUrl}>Book this class</a>
                  )}
                </article>
              ))}
            </div>

            <ScheduleView items={items} pastItems={pastItems} />
          </>
        )}
      </div>
    </main>
  )
}
