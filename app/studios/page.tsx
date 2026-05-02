import type { Metadata } from "next"
import Link from "next/link"
import { getSources } from "@/lib/queries"
import { StudioImage } from "@/app/components/StudioImage"

export const metadata: Metadata = {
  title: "NYC Craft Studios & Workshops | maitelier.",
  description:
    "Browse independent craft studios in New York City offering hands-on workshops in ceramics, glassblowing, woodworking, textiles, jewelry, and more.",
}

export default async function StudiosPage() {
  const sources = await getSources()
  const studios = sources
    .filter((s) => s.slug)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="min-h-screen bg-claret p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="font-display italic text-2xl font-normal text-cream">Studios</h1>
          <p className="font-sans mt-1 text-xs text-cream-soft">{studios.length} studios in New York City</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {studios.map((studio) => (
            <Link
              key={studio.id}
              href={`/studios/${studio.slug}`}
              className="group border border-stone-warm/20 bg-claret-deep overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="aspect-video overflow-hidden bg-claret-deep flex items-center justify-center">
                <StudioImage
                  slug={studio.slug!}
                  name={studio.name}
                  fallbackUrl={studio.photoUrl}
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  placeholderClassName="flex items-center justify-center w-full h-full"
                />
              </div>
              <div className="p-3">
                <h2 className="italic text-sm font-semibold text-cream leading-snug">{studio.name}</h2>
                {studio.neighborhood && (
                  <p className="font-sans text-xs text-cream-soft mt-0.5">{studio.neighborhood}</p>
                )}
                {studio.description && (
                  <p className="font-sans text-xs text-cream-soft/70 mt-1.5 leading-relaxed line-clamp-2">
                    {studio.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
