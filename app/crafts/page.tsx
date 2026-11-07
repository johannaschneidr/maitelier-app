import type { Metadata } from "next"
import Link from "next/link"
import { getCatalog, upcomingInCraft } from "@/lib/catalog"
import { CRAFTS } from "@/lib/taxonomy/crafts"
import { SITE_URL } from "@/lib/jsonld"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Creative workshops in NYC by craft | maitelier.",
  description: "Pottery, glass, woodworking, printmaking, textiles and more: hands-on classes at independent New York City studios, by craft.",
  alternates: { canonical: `${SITE_URL}/crafts` },
}

export default async function CraftsPage() {
  const catalog = await getCatalog()
  const crafts = CRAFTS.map((c) => ({ ...c, count: upcomingInCraft(catalog, c.slug).length })).filter((c) => c.count > 0)

  return (
    <main className="min-h-screen bg-claret">
      <div className="mx-auto max-w-4xl px-6 md:px-10 py-8">
        <h1 className="font-display italic text-2xl font-bold text-cream">Crafts</h1>
        <ul className="mt-6 space-y-2">
          {crafts.map((c) => (
            <li key={c.slug} className="border border-stone-warm/20 bg-claret-deep px-3.5 py-3 flex justify-between">
              <Link href={`/crafts/${c.slug}`} className="text-base font-semibold text-cream hover:underline">{c.label}</Link>
              <span className="font-sans text-xs text-cream-soft">{c.count} {c.count === 1 ? "class" : "classes"}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
