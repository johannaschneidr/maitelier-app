import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSourceBySlug, getTemplatesBySourceId, getSessionsByTemplateIds } from "@/lib/queries"
import { StudioImage } from "@/app/components/StudioImage"
import { StudioGallery } from "@/app/components/StudioGallery"
import { ScheduleList, type ScheduleRow } from "@/app/components/ScheduleList"
import type { ClassSession, ClassTemplate } from "@/types/db"

function formatDateTime(start: Date, end: Date): string {
  const date = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  const fmt = (d: Date) => d.getMinutes() === 0
    ? d.toLocaleTimeString("en-US", { hour: "numeric" })
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${date} · ${fmt(start)} – ${fmt(end)}`
}

function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

type SessionPair = { session: ClassSession; template: ClassTemplate }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const source = await getSourceBySlug(slug)
  if (!source) return {}

  const title = `${source.name} Classes & Workshops in NYC | maitelier.`
  const description =
    source.description ??
    `Browse and book hands-on classes at ${source.name}${source.neighborhood ? ` in ${source.neighborhood}` : ""}, NYC.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(source.photoUrl && { images: [{ url: source.photoUrl }] }),
    },
  }
}

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const source = await getSourceBySlug(slug)
  if (!source) notFound()

  const templates = await getTemplatesBySourceId(source.id)
  const sessions = await getSessionsByTemplateIds(templates.map((t) => t.id))

  const templateById = new Map(templates.map((t) => [t.id, t]))
  const pairs: SessionPair[] = sessions
    .map((s) => ({ session: s, template: templateById.get(s.templateId) }))
    .filter((p): p is SessionPair => !!p.template)
    .sort((a, b) => a.session.startTime.getTime() - b.session.startTime.getTime())

  const externalUrl = source.bookingUrl ?? source.website

  const mapsUrl = source.address
    ? `https://maps.google.com/?q=${encodeURIComponent(source.address)}`
    : null

  const scheduleRows: ScheduleRow[] = pairs.map(({ session, template }) => ({
    id: session.id,
    dateTimeLabel: formatDateTime(session.startTime, session.endTime),
    title: template.title,
    category: categoryLabel(template.category),
    price: template.price,
    capacity: session.capacity,
    spotsLeft: session.spotsLeft,
    bookUrl: template.url ?? externalUrl,
  }))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: source.name,
    ...(source.description && { description: source.description }),
    ...(source.address && {
      address: { "@type": "PostalAddress", streetAddress: source.address },
    }),
    ...(source.website && { url: source.website }),
    ...(source.phone && { telephone: source.phone }),
    ...(source.coordinates && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: source.coordinates.lat,
        longitude: source.coordinates.lng,
      },
    }),
    ...(source.instagramHandle && {
      sameAs: [`https://instagram.com/${source.instagramHandle}`],
    }),
  }

  const galleryPhotos = source.photoUrls ?? (source.photoUrl ? [source.photoUrl] : [])

  return (
    <main className="min-h-screen bg-claret">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-6 md:px-10 py-8">
        {/* Hero: image left, info right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Square hero image */}
          <div className="aspect-square overflow-hidden bg-claret-deep flex items-center justify-center">
            <StudioImage
              slug={source.slug!}
              name={source.name}
              fallbackUrl={source.photoUrls?.[0] ?? source.photoUrl}
              imgClassName="w-full h-full object-cover"
              placeholderClassName="flex items-center justify-center w-full h-full"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h1 className="font-display italic text-2xl font-bold text-cream leading-tight">
              {source.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 font-sans text-xs text-cream-soft">
              {source.neighborhood && <span>{source.neighborhood}</span>}
              {source.neighborhood && source.address && (
                <span className="text-cream-soft/40 select-none">&middot;</span>
              )}
              {source.address && mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-cream transition"
                >
                  {source.address.split(",").slice(0, 2).join(",")}
                </a>
              )}
              {source.address && !mapsUrl && <span>{source.address.split(",").slice(0, 2).join(",")}</span>}
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs font-medium text-cream-soft hover:text-cream underline"
                >
                  {source.bookingUrl ? "Book classes" : "Website"}
                </a>
              )}
              {source.instagramHandle && (
                <a
                  href={`https://instagram.com/${source.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-xs font-medium text-cream-soft hover:text-cream underline"
                >
                  @{source.instagramHandle}
                </a>
              )}
            </div>

            {source.description && (
              <p className="mt-4 italic text-sm text-cream-soft leading-relaxed">
                {source.description}
              </p>
            )}
          </div>
        </div>

        {/* Upcoming classes */}
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-cream-soft mb-4">
          Upcoming classes
        </h2>
        <ScheduleList rows={scheduleRows} fallbackUrl={externalUrl} />

        {/* Photo gallery */}
        {galleryPhotos.length > 0 && (
          <div className="mt-12">
            <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-cream-soft mb-4">
              Photos
            </h2>
            <StudioGallery photoUrls={galleryPhotos} name={source.name} />
          </div>
        )}
      </div>
    </main>
  )
}
