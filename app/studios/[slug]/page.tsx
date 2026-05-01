import Link from "next/link"
import { notFound } from "next/navigation"
import { getSourceBySlug, getTemplatesBySourceId, getSessionsByTemplateIds } from "@/lib/queries"
import type { ClassSession, ClassTemplate } from "@/types/db"

function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${fmt(start)} – ${fmt(end)}`
}

function formatDayLabel(dateString: string): string {
  const d = new Date(dateString)
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

type SessionPair = { session: ClassSession; template: ClassTemplate }

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

  // Group by day
  const byDay = new Map<string, SessionPair[]>()
  for (const pair of pairs) {
    const key = pair.session.startTime.toDateString()
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(pair)
  }
  const sortedDays = Array.from(byDay.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  const externalUrl = source.bookingUrl ?? source.website

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        {/* Back link */}
        <Link
          href="/studios"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition mb-6"
        >
          ← Studios
        </Link>

        {/* Studio header */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden mb-8">
          {source.photoUrl && (
            <div className="h-48 overflow-hidden">
              <img src={source.photoUrl} alt={source.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{source.name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {[source.neighborhood, source.address].filter(Boolean).join(" · ")}
            </p>

            {/* Links row */}
            <div className="flex flex-wrap gap-3 mt-4">
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
                >
                  {source.bookingUrl ? "Book classes ↗" : "Website ↗"}
                </a>
              )}
              {source.website && source.bookingUrl && (
                <a
                  href={source.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
                >
                  Website ↗
                </a>
              )}
              {source.instagramHandle && (
                <a
                  href={`https://instagram.com/${source.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
                >
                  @{source.instagramHandle} ↗
                </a>
              )}
              {source.phone && (
                <a
                  href={`tel:${source.phone}`}
                  className="text-sm text-zinc-500 dark:text-zinc-400"
                >
                  {source.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming classes */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Upcoming classes
        </h2>

        {sortedDays.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-500 dark:text-zinc-400">
            No upcoming classes listed.
            {externalUrl && (
              <> Check{" "}
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
                  their schedule
                </a>{" "}
                for availability.
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDays.map((dayKey) => {
              const dayPairs = byDay.get(dayKey)!
              return (
                <section key={dayKey}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                    {formatDayLabel(dayKey)}
                  </h3>
                  <ul className="space-y-2">
                    {dayPairs.map(({ session, template }) => {
                      const start = session.startTime
                      const end = session.endTime
                      const isFull = session.spotsLeft === 0
                      const availabilityUnknown = session.capacity < 0 || session.spotsLeft < 0
                      return (
                        <li
                          key={session.id}
                          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-3 shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-zinc-500 dark:text-zinc-500">{formatTimeRange(start, end)}</p>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug mt-0.5">
                              {template.title}
                              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                                {" · "}{categoryLabel(template.category)}
                                {template.price > 0 && ` · $${template.price}`}
                              </span>
                            </p>
                            {!availabilityUnknown && (
                              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                                {session.spotsLeft} of {session.capacity} spots left
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isFull && (
                              <span className="rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium px-2 py-0.5">
                                Full
                              </span>
                            )}
                            {(template.url ?? externalUrl) && (
                              <a
                                href={template.url ?? externalUrl!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 hover:opacity-90 transition inline-flex items-center gap-1.5"
                              >
                                Book
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
                                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
