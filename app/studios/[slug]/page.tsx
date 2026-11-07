import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCatalog, priceRange } from "@/lib/catalog"
import { studioLead } from "@/lib/answers"
import { breadcrumbs, postalAddress, sessionEvent, SITE_URL } from "@/lib/jsonld"
import { formatPrice, formatSessionRow, joinList } from "@/lib/format"
import { getCraft } from "@/lib/taxonomy/crafts"
import { outboundHref, OUTBOUND_REL } from "@/lib/outbound"
import { StudioImage } from "@/app/components/StudioImage"
import { StudioGallery } from "@/app/components/StudioGallery"
import { ScheduleList, type ScheduleRow } from "@/app/components/ScheduleList"
import { AnswerLead } from "@/app/components/AnswerLead"
import { FactsBlock } from "@/app/components/FactsBlock"
import { LastChecked } from "@/app/components/LastChecked"
import { ClassList } from "@/app/components/ClassList"
import { Breadcrumbs } from "@/app/components/Breadcrumbs"
import { JsonLd } from "@/app/components/JsonLd"

export const revalidate = 3600

/** Cap on Event markup per page so it stays light. */
const EVENTS_IN_MARKUP = 20

type Params = { params: Promise<{ slug: string }> }

/** Third-party booking systems a visitor would recognize; everything else books on the studio's own site. */
const BOOKING_PLATFORM_LABEL: Record<string, string> = {
  fareharbor: "FareHarbor",
  acuity: "Acuity",
  eventbrite: "Eventbrite",
  meetup: "Meetup",
  luma: "Luma",
  square: "Square",
}

function bookingLabel(platform: string | undefined): string {
  if (!platform) return ""
  const name = BOOKING_PLATFORM_LABEL[platform.toLowerCase()]
  return name ? `Through ${name}` : "On the studio's website"
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const view = (await getCatalog()).studioBySlug.get(slug)
  if (!view) return {}
  const { studio } = view
  const lead = studioLead(view)
  const title = `${studio.name} Classes & Workshops in ${studio.neighborhood ?? "NYC"} | maitelier.`
  const description = `${lead.headline} ${lead.detail}`
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/studios/${slug}` },
    openGraph: {
      title,
      description: lead.headline,
      ...(studio.photoUrl && { images: [{ url: studio.photoUrl }] }),
    },
  }
}

export default async function StudioPage({ params }: Params) {
  const { slug } = await params
  const view = (await getCatalog()).studioBySlug.get(slug)
  if (!view) notFound()

  const { studio, classes } = view
  const lead = studioLead(view)
  const externalUrl = studio.bookingUrl ?? studio.website
  const mapsUrl = studio.address ? `https://maps.google.com/?q=${encodeURIComponent(studio.address)}` : null
  const scheduled = classes.filter((c) => c.sessions.length > 0)
  const range = priceRange(scheduled.length > 0 ? scheduled : classes)

  // Every upcoming session across the studio's classes, soonest first.
  const sessions = classes
    .flatMap((c) => c.sessions.map((s) => ({ c, s })))
    .sort((a, b) => a.s.start.getTime() - b.s.start.getTime())

  const scheduleRows: ScheduleRow[] = sessions.map(({ c, s }) => ({
    id: s.id,
    dateTimeLabel: formatSessionRow(s.start, s.end),
    title: c.title,
    category: getCraft(c.craft)?.label ?? "",
    price: c.price,
    capacity: s.capacity,
    spotsLeft: s.spotsLeft,
    bookUrl: c.bookingUrl || externalUrl ? outboundHref(slug, "detail_schedule", c.bookingUrl ? s.templateId : undefined) : undefined,
  }))

  const sameAs = [
    studio.website,
    studio.instagramHandle && `https://instagram.com/${studio.instagramHandle}`,
    studio.placeId && `https://www.google.com/maps/place/?q=place_id:${studio.placeId}`,
  ].filter(Boolean)

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: studio.name,
    ...(studio.description && { description: studio.description }),
    ...(studio.address && { address: postalAddress(studio) }),
    ...(studio.website && { url: studio.website }),
    ...(studio.phone && { telephone: studio.phone }),
    ...(studio.coordinates && {
      geo: { "@type": "GeoCoordinates", latitude: studio.coordinates.lat, longitude: studio.coordinates.lng },
    }),
    ...(sameAs.length > 0 && { sameAs }),
  }

  const crumbs = [
    { name: "Studios", path: "/studios" },
    { name: studio.name, path: `/studios/${slug}` },
  ]

  const galleryPhotos = studio.photoUrls ?? (studio.photoUrl ? [studio.photoUrl] : [])

  return (
    <main className="min-h-screen bg-claret">
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={breadcrumbs(crumbs)} />
      {sessions.length > 0 && <JsonLd data={sessions.slice(0, EVENTS_IN_MARKUP).map(({ c, s }) => sessionEvent(c, s))} />}

      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
        <Breadcrumbs items={crumbs} />

        {/* Hero: image left, answer right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="aspect-square overflow-hidden bg-claret-deep flex items-center justify-center">
            <StudioImage
              slug={slug}
              name={studio.name}
              fallbackUrl={studio.photoUrls?.[0] ?? studio.photoUrl}
              imgClassName="w-full h-full object-cover"
              placeholderClassName="flex items-center justify-center w-full h-full"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="font-display italic text-2xl font-bold text-cream leading-tight">{studio.name}</h1>

            <AnswerLead lead={lead} />

            <div className="flex flex-wrap gap-3 mt-4">
              {externalUrl && (
                <a
                  href={outboundHref(slug, "detail_page")}
                  target="_blank"
                  rel={OUTBOUND_REL}
                  className="font-sans text-xs font-medium text-cream-soft hover:text-cream underline"
                >
                  {studio.bookingUrl ? "Book classes" : "Website"}
                </a>
              )}
              {studio.instagramHandle && (
                <a
                  href={`https://instagram.com/${studio.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs font-medium text-cream-soft hover:text-cream underline"
                >
                  @{studio.instagramHandle}
                </a>
              )}
            </div>
          </div>
        </div>

        <FactsBlock
          facts={[
            {
              label: "Crafts",
              value: joinList(view.crafts.map((c) => getCraft(c)!.label)),
            },
            { label: "Neighborhood", value: studio.neighborhood ?? "" },
            {
              label: "Address",
              value: studio.address?.split(",").slice(0, 2).join(",") ?? "",
              href: mapsUrl ?? undefined,
              external: true,
            },
            {
              label: "Price range",
              value: range ? (range.min === range.max ? formatPrice(range.min) : `${formatPrice(range.min)}–${formatPrice(range.max)}`) : "",
            },
            { label: "Classes scheduled", value: scheduled.length > 0 ? String(scheduled.length) : "" },
            { label: "Booking", value: bookingLabel(studio.bookingPlatform) },
          ]}
        />

        {classes.length > 0 && (
          <section className="mt-12">
            <h2 className="font-sans mb-4 text-xs font-semibold uppercase tracking-wider text-cream-soft">Classes</h2>
            <ClassList classes={classes} />
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-sans mb-4 text-xs font-semibold uppercase tracking-wider text-cream-soft">Upcoming sessions</h2>
          <ScheduleList rows={scheduleRows} fallbackUrl={externalUrl ? outboundHref(slug, "detail_schedule_empty") : undefined} />
          <LastChecked at={view.lastCheckedAt} />
        </section>

        {studio.description && (
          <section className="mt-12">
            <h2 className="font-sans mb-3 text-xs font-semibold uppercase tracking-wider text-cream-soft">About {studio.name}</h2>
            <p className="text-sm text-cream-soft leading-relaxed max-w-2xl">{studio.description}</p>
          </section>
        )}

        {galleryPhotos.length > 0 && (
          <section className="mt-12">
            <h2 className="font-sans mb-4 text-xs font-semibold uppercase tracking-wider text-cream-soft">Photos</h2>
            <StudioGallery photoUrls={galleryPhotos} name={studio.name} />
          </section>
        )}
      </div>
    </main>
  )
}
