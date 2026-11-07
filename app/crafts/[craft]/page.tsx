import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCatalog, priceRange, upcomingInCraft } from "@/lib/catalog"
import { craftLead } from "@/lib/answers"
import { breadcrumbs, collectionPage, SITE_URL } from "@/lib/jsonld"
import { formatPrice } from "@/lib/format"
import { getCraft } from "@/lib/taxonomy/crafts"
import { AnswerLead } from "@/app/components/AnswerLead"
import { FactsBlock } from "@/app/components/FactsBlock"
import { LastChecked } from "@/app/components/LastChecked"
import { ClassList } from "@/app/components/ClassList"
import { Breadcrumbs } from "@/app/components/Breadcrumbs"
import { JsonLd } from "@/app/components/JsonLd"

export const revalidate = 3600

type Params = { params: Promise<{ craft: string }> }

function pageTitle(label: string) {
  return `${label} classes in NYC`
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { craft: slug } = await params
  const craft = getCraft(slug)
  if (!craft) return {}
  const lead = craftLead(craft.slug, upcomingInCraft(await getCatalog(), craft.slug))
  const title = `${pageTitle(craft.label)} | maitelier.`
  return {
    title,
    description: `${lead.headline} ${lead.detail}`,
    alternates: { canonical: `${SITE_URL}/crafts/${craft.slug}` },
    openGraph: { title, description: lead.headline },
  }
}

export default async function CraftHubPage({ params }: Params) {
  const { craft: slug } = await params
  const craft = getCraft(slug)
  if (!craft) notFound()

  const catalog = await getCatalog()
  const upcoming = upcomingInCraft(catalog, craft.slug)
  const lead = craftLead(craft.slug, upcoming)
  const range = priceRange(upcoming)
  const studios = new Set(upcoming.map((c) => c.studio.slug))

  const byHood = new Map<string, number>()
  for (const c of upcoming) {
    const hood = c.studio.neighborhood ?? "Other"
    byHood.set(hood, (byHood.get(hood) ?? 0) + 1)
  }
  const hoods = [...byHood.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const lastCheckedAt = upcoming.reduce<Date | undefined>(
    (max, c) => (c.lastCheckedAt && (!max || c.lastCheckedAt > max) ? c.lastCheckedAt : max),
    undefined
  )

  const crumbs = [
    { name: "Crafts", path: "/crafts" },
    { name: craft.label, path: `/crafts/${craft.slug}` },
  ]

  return (
    <main className="min-h-screen bg-claret">
      <JsonLd data={breadcrumbs(crumbs)} />
      {upcoming.length > 0 && <JsonLd data={collectionPage(pageTitle(craft.label), `/crafts/${craft.slug}`, upcoming)} />}

      <div className="mx-auto max-w-4xl px-6 md:px-10 py-8">
        <Breadcrumbs items={crumbs} />
        <h1 className="font-display italic text-2xl font-bold text-cream leading-tight">{pageTitle(craft.label)}</h1>

        <AnswerLead lead={lead} />

        <FactsBlock
          facts={[
            { label: "Classes scheduled", value: String(upcoming.length) },
            { label: "Studios", value: String(studios.size) },
            { label: "Price range", value: range ? (range.min === range.max ? formatPrice(range.min) : `${formatPrice(range.min)}–${formatPrice(range.max)}`) : "" },
            { label: "Neighborhoods", value: hoods.length > 0 ? String(hoods.length) : "" },
          ]}
        />

        <h2 className="font-sans mt-10 mb-4 text-xs font-semibold uppercase tracking-wider text-cream-soft">Classes by next date</h2>
        <ClassList classes={upcoming} showStudio />
        <LastChecked at={lastCheckedAt} />

        {hoods.length > 1 && (
          <section className="mt-10">
            <h2 className="font-sans mb-3 text-xs font-semibold uppercase tracking-wider text-cream-soft">By neighborhood</h2>
            <ul className="font-sans text-xs text-cream-soft grid grid-cols-2 sm:grid-cols-3 gap-y-1">
              {hoods.map(([hood, n]) => (
                <li key={hood}>
                  {hood} <span className="text-cream-soft/60">· {n}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="font-sans mt-10 text-xs text-cream-soft">
          <Link href="/crafts" className="underline hover:text-cream">All crafts</Link>
        </p>
      </div>
    </main>
  )
}
