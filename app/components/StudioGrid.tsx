"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { StudioImage } from "@/app/components/StudioImage"

type Studio = {
  id: string
  slug?: string
  name: string
  neighborhood?: string
  description?: string
  photoUrl?: string
}

export function StudioGrid({ studios }: { studios: Studio[] }) {
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set())
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const neighborhoods = useMemo(
    () => [...new Set(studios.map((s) => s.neighborhood).filter((n): n is string => Boolean(n)))].sort(),
    [studios]
  )

  function toggleNeighborhood(n: string) {
    setSelectedNeighborhoods((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  const filtered = useMemo(
    () =>
      selectedNeighborhoods.size === 0
        ? studios
        : studios.filter((s) => s.neighborhood && selectedNeighborhoods.has(s.neighborhood)),
    [studios, selectedNeighborhoods]
  )

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className={`font-sans rounded-full px-3 py-1.5 text-xs font-medium transition border ${
              selectedNeighborhoods.size > 0
                ? "bg-cream text-claret border-transparent"
                : "bg-transparent border-stone-warm/30 text-cream-soft hover:border-stone-warm/40"
            }`}
          >
            Neighborhood{selectedNeighborhoods.size > 0 ? ` (${selectedNeighborhoods.size})` : ""}
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-stone-warm/20 bg-claret-deep py-1 shadow-lg">
                {selectedNeighborhoods.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedNeighborhoods(new Set())}
                    className="font-sans w-full px-3 py-1.5 text-left text-xs font-medium text-cream-soft hover:bg-stone-warm/10"
                  >
                    Remove all
                  </button>
                )}
                {neighborhoods.map((n) => (
                  <label key={n} className="font-sans flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-cream-soft hover:bg-stone-warm/10">
                    <input type="checkbox" checked={selectedNeighborhoods.has(n)} onChange={() => toggleNeighborhood(n)} className="sr-only" />
                    <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-colors ${selectedNeighborhoods.has(n) ? "bg-cream border-cream" : "border-stone-warm/40"}`}>
                      {selectedNeighborhoods.has(n) && (
                        <svg className="h-2 w-2 text-claret" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
                        </svg>
                      )}
                    </span>
                    {n}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((studio) => (
          <Link
            key={studio.id}
            href={`/studios/${studio.slug}`}
            className="group border border-stone-warm/20 bg-claret-deep overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="aspect-video overflow-hidden bg-claret-deep flex items-center justify-center">
              <StudioImage
                slug={studio.slug!}
                name={studio.name}
                fallbackUrl={studio.photoUrl ?? undefined}
                imgClassName="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                placeholderClassName="flex items-center justify-center w-full h-full"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-light text-cream-soft/70 leading-snug">
                <span className="font-display text-base font-semibold italic text-cream">{studio.name}</span>
                {studio.neighborhood && (
                  <span className="font-sans font-light"> · {studio.neighborhood}</span>
                )}
              </p>
              {studio.description && (
                <p className="font-display italic text-sm text-cream-soft/70 mt-1.5 leading-snug line-clamp-2">
                  {studio.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
