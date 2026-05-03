import type { Metadata } from "next"
import { getSources } from "@/lib/queries"
import { StudioGrid } from "@/app/components/StudioGrid"

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

        <StudioGrid studios={studios} />
      </div>
    </main>
  )
}
