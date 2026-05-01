import type { Metadata } from "next"
import Link from "next/link"
import { getSources } from "@/lib/queries"
import { StudioImage } from "@/app/components/StudioImage"

export const metadata: Metadata = {
  title: "NYC Craft Studios & Workshops | CraftPass",
  description:
    "Browse independent craft studios in New York City offering hands-on workshops in ceramics, glassblowing, woodworking, textiles, jewelry, and more.",
}

export default async function StudiosPage() {
  const sources = await getSources()
  const studios = sources
    .filter((s) => s.slug)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Studios</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{studios.length} studios in New York City</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {studios.map((studio) => (
            <Link
              key={studio.id}
              href={`/studios/${studio.slug}`}
              className="group border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <StudioImage
                  slug={studio.slug!}
                  name={studio.name}
                  fallbackUrl={studio.photoUrl}
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  placeholderClassName="flex items-center justify-center w-full h-full"
                />
              </div>
              <div className="p-3">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">{studio.name}</h2>
                {studio.neighborhood && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{studio.neighborhood}</p>
                )}
                {studio.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed line-clamp-2">
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
