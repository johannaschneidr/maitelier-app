import { getUpcomingSessions, getPastSessions, getTemplates, getSources } from "@/lib/queries"
import { ScheduleView } from "@/app/components/ScheduleView"
import type { ScheduleItem } from "@/types/schedule"

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

  return (
    <main className="min-h-screen bg-claret p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="font-display italic text-2xl font-normal text-cream leading-snug">
            Find creative classes in New York City that fit your schedule.
          </h1>
        </header>

        {items.length === 0 ? (
          <p className="text-cream-soft">
            No upcoming sessions. Check back later or run the dev seed.
          </p>
        ) : (
          <ScheduleView items={items} pastItems={pastItems} />
        )}
      </div>
    </main>
  )
}
