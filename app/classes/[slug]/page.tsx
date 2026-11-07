import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCatalog } from "@/lib/catalog"
import { classLead } from "@/lib/answers"
import { breadcrumbs, classUrl, sessionEvent } from "@/lib/jsonld"
import { formatDuration, formatPrice, formatSessionRow } from "@/lib/format"
import { getCraft } from "@/lib/taxonomy/crafts"
import { outboundHref, OUTBOUND_REL } from "@/lib/outbound"
import { AnswerLead } from "@/app/components/AnswerLead"
import { FactsBlock, type Fact } from "@/app/components/FactsBlock"
import { LastChecked } from "@/app/components/LastChecked"
import { ClassList } from "@/app/components/ClassList"
import { Breadcrumbs } from "@/app/components/Breadcrumbs"
import { JsonLd } from "@/app/components/JsonLd"
import { ScheduleList, type ScheduleRow } from "@/app/components/ScheduleList"

/** Re-render at most hourly so "next session" and "checked … ago" stay current. */
export const revalidate = 3600

const SESSIONS_SHOWN = 8

const LEVEL_LABEL = { beginner: "Beginner", "all-levels": "All levels", intermediate: "Intermediate", advanced: "Advanced" }

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const c = (await getCatalog()).classBySlug.get(slug)
  if (!c) return {}
  const craft = getCraft(c.craft)!
  const where = c.studio.neighborhood ?? "NYC"
  const title = `${c.title} at ${c.studio.name} · ${craft.label} class in ${where} | maitelier.`
  const lead = classLead(c)
  return {
    title,
    description: `${lead.headline} ${lead.detail}`,
    alternates: { canonical: classUrl(c) },
    openGraph: { title, description: lead.headline, url: classUrl(c) },
  }
}

export default async function ClassPage({ params }: Params) {
  const { slug } = await params
  const c = (await getCatalog()).classBySlug.get(slug)
  if (!c) notFound()

  const catalog = await getCatalog()
  const craft = getCraft(c.craft)!
  const studio = c.studio
  const next = c.sessions[0]
  const lead = classLead(c)
  const { attrs } = c

  const takeHome =
    attrs.takeHome === "same-day"
      ? "Yes, same day"
      : attrs.takeHome === "fired-later"
        ? `Yes, ready for pickup ${attrs.pickupAfter ? `after ${attrs.pickupAfter}` : "later"}`
        : attrs.takeHome === "no"
          ? "No"
          : ""

  const facts: Fact[] = [
    { label: "Price", value: c.price > 0 ? `${formatPrice(c.price)} per person` : "See studio for price" },
    { label: "Duration", value: c.durationMin > 0 ? formatDuration(c.durationMin) : "" },
    { label: "Level", value: attrs.level ? LEVEL_LABEL[attrs.level] : "" },
    { label: "Craft", value: craft.label, href: `/crafts/${craft.slug}` },
    { label: "Group size", value: next && next.capacity > 0 ? `Up to ${next.capacity} people` : "" },
    { label: "What you make", value: attrs.whatYouMake ?? "" },
    { label: "Take-home", value: takeHome },
    { label: "Materials", value: attrs.materialsIncluded === undefined ? "" : attrs.materialsIncluded ? "Included" : "Not included" },
    { label: "BYOB", value: attrs.byob === undefined ? "" : attrs.byob ? "Yes" : "No" },
    { label: "Ages", value: attrs.minAge ? `${attrs.minAge}+` : "" },
    { label: "Studio", value: studio.name, href: `/studios/${studio.slug}` },
    { label: "Neighborhood", value: studio.neighborhood ?? "" },
    {
      label: "Address",
      value: studio.address?.split(",").slice(0, 2).join(",") ?? "",
      href: studio.address ? `https://maps.google.com/?q=${encodeURIComponent(studio.address)}` : undefined,
      external: true,
    },
  ]

  const hasBooking = !!(c.bookingUrl ?? studio.bookingUrl ?? studio.website)
  const rows: ScheduleRow[] = c.sessions.slice(0, SESSIONS_SHOWN).map((s) => ({
    id: s.id,
    dateTimeLabel: formatSessionRow(s.start, s.end),
    title: c.title,
    category: craft.label,
    price: c.price,
    capacity: s.capacity,
    spotsLeft: s.spotsLeft,
    bookUrl: hasBooking ? outboundHref(studio.slug, "class_schedule", c.bookingUrl ? s.templateId : undefined) : undefined,
  }))

  const moreAtStudio = (catalog.studioBySlug.get(studio.slug)?.classes ?? []).filter((x) => x.slug !== c.slug).slice(0, 6)

  const crumbs = [
    { name: "Studios", path: "/studios" },
    { name: studio.name, path: `/studios/${studio.slug}` },
    { name: c.title, path: `/classes/${c.slug}` },
  ]

  return (
    <main className="min-h-screen bg-claret">
      <JsonLd data={breadcrumbs(crumbs)} />
      {c.sessions.length > 0 && <JsonLd data={c.sessions.slice(0, SESSIONS_SHOWN).map((s) => sessionEvent(c, s))} />}

      <div className="mx-auto max-w-4xl px-6 md:px-10 py-8">
        <Breadcrumbs items={crumbs} />

        <h1 className="font-display italic text-2xl font-bold text-cream leading-tight">{c.title}</h1>
        <p className="font-sans mt-1 text-xs text-cream-soft">
          <Link href={`/studios/${studio.slug}`} className="underline hover:text-cream">{studio.name}</Link>
          {studio.neighborhood && <> · {studio.neighborhood}</>}
        </p>

        <AnswerLead lead={lead} />

        {hasBooking && (
          <a
            href={outboundHref(studio.slug, "class_page", c.bookingUrl ? c.id : undefined)}
            target="_blank"
            rel={OUTBOUND_REL}
            className="font-sans inline-block mt-4 border border-cream/40 px-3 py-1.5 text-xs font-medium text-cream hover:bg-cream hover:text-claret transition"
          >
            {next ? "Book a seat" : "See the studio's schedule"}
          </a>
        )}

        <FactsBlock facts={facts} />

        <h2 className="font-sans mt-10 mb-4 text-xs font-semibold uppercase tracking-wider text-cream-soft">Upcoming sessions</h2>
        <ScheduleList rows={rows} fallbackUrl={hasBooking ? outboundHref(studio.slug, "class_schedule") : undefined} />
        <LastChecked at={c.lastCheckedAt} />

        {c.description && (
          <section className="mt-10">
            <h2 className="font-sans mb-3 text-xs font-semibold uppercase tracking-wider text-cream-soft">About this class</h2>
            <p className="text-sm text-cream-soft leading-relaxed whitespace-pre-line max-w-2xl">{c.description}</p>
          </section>
        )}

        {moreAtStudio.length > 0 && (
          <section className="mt-10">
            <h2 className="font-sans mb-4 text-xs font-semibold uppercase tracking-wider text-cream-soft">More at {studio.name}</h2>
            <ClassList classes={moreAtStudio} />
          </section>
        )}

        <p className="font-sans mt-10 text-xs text-cream-soft">
          More{" "}
          <Link href={`/crafts/${craft.slug}`} className="underline hover:text-cream">
            {craft.label.toLowerCase()} classes in NYC
          </Link>
        </p>
      </div>
    </main>
  )
}
