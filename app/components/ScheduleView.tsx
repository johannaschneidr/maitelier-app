"use client"

import { useMemo, useState, useEffect } from "react"
import posthog from "posthog-js"

const FAVORITES_STORAGE_KEY = "craftpass-favorites"

function loadSavedIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveSavedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}
import Link from "next/link"
import type { ScheduleItem } from "@/types/schedule"

function formatDay(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  })
}

function getStartOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDayLabel(dayKey: string): string {
  const d = new Date(dayKey)
  const startOfToday = getStartOfToday()
  const startOfTomorrow = new Date(startOfToday)
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)
  if (d.toDateString() === startOfToday.toDateString()) return "Today"
  if (d.toDateString() === startOfTomorrow.toDateString()) return "Tomorrow"
  return formatDay(d)
}

function formatDuration(durationMin: number): string {
  if (durationMin <= 60) return `${durationMin} min`
  const h = Math.floor(durationMin / 60)
  const m = durationMin % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

function formatTimeShort(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const hour = h % 12 || 12
  const ampm = h < 12 ? "AM" : "PM"
  return m === 0 ? `${hour} ${ampm}` : `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

function formatTimeRange(start: Date, end: Date): string {
  return `${formatTimeShort(start)} – ${formatTimeShort(end)}`
}

function formatStartTime(start: Date): string {
  return formatTimeShort(start)
}

function formatTimeAndDuration(start: Date, end: Date, durationMin: number): string {
  return `${formatTimeRange(start, end)} (${formatDuration(durationMin)})`
}

function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

const cardText = "text-sm leading-snug"

type FilterId = "afterWork" | "weekendMorning" | "under75" | "twoHoursOrLess" | "favorites"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "afterWork", label: "After work (6–9pm)" },
  { id: "weekendMorning", label: "Weekend morning" },
  { id: "under75", label: "Under $75" },
  { id: "twoHoursOrLess", label: "2 hours or less" },
  { id: "favorites", label: "My favorites" }
]

function shortenAddress(address: string): string {
  const parts = address.split(", ")
  return parts.slice(0, 2).join(", ")
}

function applyFilters(
  items: ScheduleItem[],
  active: Set<FilterId>,
  selectedNeighborhoods: Set<string>,
  selectedDates: Set<string>,
  selectedCategories: Set<string>,
  savedIds: Set<string>
): ScheduleItem[] {
  return items.filter((item) => {
    const start = new Date(item.session.startTime)
    const end = new Date(item.session.endTime)
    const dateKey = start.toDateString()
    const hour = start.getHours()
    const day = start.getDay()
    const isWeekend = day === 0 || day === 6
    const isWeekendMorning = isWeekend && hour >= 8 && hour < 12
    const isAfterWork = hour >= 18 && hour < 21
    const under75 = item.template.price <= 75
    const durationMin = Math.round((end.getTime() - start.getTime()) / (60 * 1000))
    const twoHoursOrLess = durationMin <= 120

    if (selectedDates.size > 0 && !selectedDates.has(dateKey)) return false
    if (active.has("favorites") && !savedIds.has(item.session.id)) return false
    if (active.has("afterWork") && !isAfterWork) return false
    if (active.has("weekendMorning") && !isWeekendMorning) return false
    if (active.has("under75") && !under75) return false
    if (active.has("twoHoursOrLess") && !twoHoursOrLess) return false
    if (selectedNeighborhoods.size > 0 && (!item.neighborhood || !selectedNeighborhoods.has(item.neighborhood))) return false
    if (selectedCategories.size > 0 && !selectedCategories.has(item.template.category)) return false
    return true
  })
}

function groupByDay(items: ScheduleItem[]): Map<string, ScheduleItem[]> {
  const map = new Map<string, ScheduleItem[]>()
  for (const item of items) {
    const start = new Date(item.session.startTime)
    const key = start.toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}

export function ScheduleView({ items, pastItems = [] }: { items: ScheduleItem[]; pastItems?: ScheduleItem[] }) {
  const [filterActive, setFilterActive] = useState<Set<FilterId>>(new Set())
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [neighborhoodDropdownOpen, setNeighborhoodDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [minimalView, setMinimalView] = useState(false)
  const [pastEventsExpanded, setPastEventsExpanded] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSavedIds(loadSavedIds())
  }, [])

  const neighborhoods = useMemo(
    () => [...new Set(items.map((i) => i.neighborhood).filter((n): n is string => Boolean(n)))].sort(),
    [items]
  )

  const availableDates = useMemo(
    () => [...new Set(items.map((i) => new Date(i.session.startTime).toDateString()))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [items]
  )

  const availableCategories = useMemo(
    () => [...new Set(items.map((i) => i.template.category).filter(Boolean))].sort(),
    [items]
  )

  const filtered = useMemo(
    () => applyFilters(items, filterActive, selectedNeighborhoods, selectedDates, selectedCategories, savedIds),
    [items, filterActive, selectedNeighborhoods, selectedDates, selectedCategories, savedIds]
  )
  const fromToday = useMemo(() => {
    const startOfToday = getStartOfToday()
    return filtered.filter((item) => new Date(item.session.startTime) >= startOfToday)
  }, [filtered])
  const byDay = useMemo(() => groupByDay(fromToday), [fromToday])
  const sortedDays = useMemo(() => {
    const startOfToday = getStartOfToday()

    // When date filter is active: show only the selected dates (from today onward)
    if (selectedDates.size > 0) {
      return [...selectedDates]
        .filter((dateKey: string) => new Date(dateKey).getTime() >= startOfToday.getTime())
        .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
    }

    // When no date filter: show range from today through last day with workshops
    const keys = Array.from(byDay.keys()).sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime())
    const minDate = startOfToday.getTime()
    const maxDate = keys.length > 0 ? new Date(keys[keys.length - 1]).getTime() : minDate
    const allDates: string[] = []
    for (let t = minDate; t <= maxDate; t += 24 * 60 * 60 * 1000) {
      allDates.push(new Date(t).toDateString())
    }
    return allDates
  }, [byDay, selectedDates])

  const pastFavorites = useMemo(
    () => (filterActive.has("favorites") ? pastItems.filter((item) => savedIds.has(item.session.id)) : []),
    [filterActive, pastItems, savedIds]
  )
  const pastByDay = useMemo(() => groupByDay(pastFavorites), [pastFavorites])
  const pastSortedDays = useMemo(
    () => Array.from(pastByDay.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [pastByDay]
  )

  const toggleFilter = (id: FilterId) => {
    setFilterActive((prev) => {
      const next = new Set(prev)
      const enabling = !next.has(id)
      if (enabling) next.add(id)
      else next.delete(id)
      posthog.capture("filter_toggled", { filter_id: id, enabled: enabling })
      return next
    })
  }

  const toggleNeighborhood = (n: string) => {
    setSelectedNeighborhoods((prev) => {
      const next = new Set(prev)
      const selecting = !next.has(n)
      if (selecting) next.add(n)
      else next.delete(n)
      posthog.capture("neighborhood_filter_changed", { neighborhood: n, selected: selecting })
      return next
    })
  }

  const toggleDate = (dateKey: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev)
      const selecting = !next.has(dateKey)
      if (selecting) next.add(dateKey)
      else next.delete(dateKey)
      posthog.capture("date_filter_changed", { date: dateKey, selected: selecting })
      return next
    })
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function formatDateForDropdown(dateKey: string): string {
    const d = new Date(dateKey)
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const toggleSave = (e: React.MouseEvent, sessionId: string, item: ScheduleItem) => {
    e.preventDefault()
    e.stopPropagation()
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
        posthog.capture("class_unsaved", {
          session_id: sessionId,
          class_title: item.template.title,
          category: item.template.category,
          price: item.template.price,
          neighborhood: item.neighborhood,
          host_name: item.hostName,
        })
      } else {
        next.add(sessionId)
        posthog.capture("class_saved", {
          session_id: sessionId,
          class_title: item.template.title,
          category: item.template.category,
          price: item.template.price,
          neighborhood: item.neighborhood,
          host_name: item.hostName,
        })
      }
      saveSavedIds(next)
      return next
    })
  }

  const toggleExpanded = (sessionId: string, item?: ScheduleItem) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      const expanding = !next.has(sessionId)
      if (expanding) {
        next.add(sessionId)
        if (item) {
          posthog.capture("class_details_expanded", {
            session_id: sessionId,
            class_title: item.template.title,
            category: item.template.category,
            price: item.template.price,
            neighborhood: item.neighborhood,
            host_name: item.hostName,
          })
        }
      } else {
        next.delete(sessionId)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-2">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-cream-soft">Filters</p>
        <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filterActive.has(f.id)
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFilter(f.id)}
              className={`font-sans rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-cream text-claret"
                  : "bg-stone-warm/20 text-cream-soft hover:bg-stone-warm/30"
              }`}
            >
              {f.label}
            </button>
          )
        })}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setDateDropdownOpen(false); setCategoryDropdownOpen(false); setNeighborhoodDropdownOpen((o) => !o) }}
            className={`font-sans rounded-full px-3 py-1.5 text-xs font-medium transition border ${
              selectedNeighborhoods.size > 0
                ? "bg-cream text-claret border-transparent"
                : "bg-transparent border-stone-warm/30 text-cream-soft hover:border-stone-warm/40"
            }`}
          >
            Neighborhood{selectedNeighborhoods.size > 0 ? ` (${selectedNeighborhoods.size})` : ""}
          </button>
          {neighborhoodDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setNeighborhoodDropdownOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-stone-warm/20 bg-claret-deep py-1 shadow-lg">
                {neighborhoods.length === 0 ? (
                  <p className="font-sans px-3 py-2 text-xs text-cream-soft">No neighborhoods</p>
                ) : (
                  <>
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
                        <input type="checkbox" checked={selectedNeighborhoods.has(n)} onChange={() => toggleNeighborhood(n)} className="rounded border-stone-warm/30" />
                        {n}
                      </label>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setNeighborhoodDropdownOpen(false); setCategoryDropdownOpen(false); setDateDropdownOpen((o) => !o) }}
            className={`font-sans rounded-full px-3 py-1.5 text-xs font-medium transition border ${
              selectedDates.size > 0
                ? "bg-cream text-claret border-transparent"
                : "bg-transparent border-stone-warm/30 text-cream-soft hover:border-stone-warm/40"
            }`}
          >
            Date{selectedDates.size > 0 ? ` (${selectedDates.size})` : ""}
          </button>
          {dateDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setDateDropdownOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] max-h-64 overflow-y-auto rounded-lg border border-stone-warm/20 bg-claret-deep py-1 shadow-lg">
                {availableDates.length === 0 ? (
                  <p className="font-sans px-3 py-2 text-xs text-cream-soft">No dates</p>
                ) : (
                  <>
                    {selectedDates.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDates(new Set())}
                        className="font-sans w-full px-3 py-1.5 text-left text-xs font-medium text-cream-soft hover:bg-stone-warm/10"
                      >
                        Remove all
                      </button>
                    )}
                    {availableDates.map((dateKey) => (
                      <label key={dateKey} className="font-sans flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-cream-soft hover:bg-stone-warm/10">
                        <input type="checkbox" checked={selectedDates.has(dateKey)} onChange={() => toggleDate(dateKey)} className="rounded border-stone-warm/30" />
                        {formatDateForDropdown(dateKey)}
                      </label>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => { setNeighborhoodDropdownOpen(false); setDateDropdownOpen(false); setCategoryDropdownOpen((o) => !o) }}
            className={`font-sans rounded-full px-3 py-1.5 text-xs font-medium transition border ${
              selectedCategories.size > 0
                ? "bg-cream text-claret border-transparent"
                : "bg-transparent border-stone-warm/30 text-cream-soft hover:border-stone-warm/40"
            }`}
          >
            Category{selectedCategories.size > 0 ? ` (${selectedCategories.size})` : ""}
          </button>
          {categoryDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setCategoryDropdownOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-stone-warm/20 bg-claret-deep py-1 shadow-lg">
                {availableCategories.length === 0 ? (
                  <p className="font-sans px-3 py-2 text-xs text-cream-soft">No categories</p>
                ) : (
                  <>
                    {selectedCategories.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories(new Set())}
                        className="font-sans w-full px-3 py-1.5 text-left text-xs font-medium text-cream-soft hover:bg-stone-warm/10"
                      >
                        Remove all
                      </button>
                    )}
                    {availableCategories.map((cat) => (
                      <label key={cat} className="font-sans flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-cream-soft hover:bg-stone-warm/10">
                        <input type="checkbox" checked={selectedCategories.has(cat)} onChange={() => toggleCategory(cat)} className="rounded border-stone-warm/30" />
                        {categoryLabel(cat)}
                      </label>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Card list, grouped by day (today onward; show "No classes found" for empty dates) */}
      <div className="space-y-8">
        {sortedDays.map((dayKey) => {
          const dayItems = byDay.get(dayKey) ?? []
          return (
            <section key={dayKey}>
              <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-cream-soft mb-3">
                {formatDayLabel(dayKey)}
              </h2>
              {dayItems.length === 0 ? (
                <p className="font-sans text-xs text-cream-soft">No classes found</p>
              ) : (
              <ul className="space-y-2">
                {dayItems.map((item) => {
                  const start = new Date(item.session.startTime)
                  const end = new Date(item.session.endTime)
                  const saved = savedIds.has(item.session.id)
                  const expanded = expandedIds.has(item.session.id)
                  const isFull = item.session.spotsLeft === 0
                  const availabilityUnknown = item.session.capacity < 0 || item.session.spotsLeft < 0
                  return (
                    <li
                      key={item.session.id}
                      className="relative border border-stone-warm/20 bg-claret-deep shadow-sm overflow-hidden"
                    >
                      {/* Heart icon: top right (same position in both modes) */}
                      <button
                        type="button"
                        onClick={(e) => toggleSave(e, item.session.id, item)}
                        className={`absolute top-1.5 right-2 p-1.5 rounded-md transition shrink-0 z-10 ${saved ? "text-red-400" : "text-cream-soft hover:text-red-400"}`}
                        aria-label={saved ? "Unsave" : "Save"}
                        title={saved ? "Unsave" : "Save"}
                      >
                        {saved ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.312 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                          </svg>
                        )}
                      </button>

                      {minimalView ? (
                        <>
                          {!expanded ? (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.session.id, item)}
                              className="w-full text-left px-3 py-3 sm:px-3.5 sm:py-3.5 flex items-center gap-2 pr-12 min-w-0"
                            >
                              <span className={`font-sans ${cardText} text-cream-soft shrink-0`}>
                                {formatStartTime(start)}
                              </span>
                              <span className="text-base font-semibold text-cream truncate min-w-0">
                                {item.template.title}
                                <span className="font-normal text-cream-soft"> · {item.hostName}</span>
                                {item.template.price > 0 && (
                                  <span className="font-sans text-xs font-normal text-cream-soft">
                                    {" · "}${item.template.price}
                                  </span>
                                )}
                              </span>
                            </button>
                          ) : (
                            <div className="px-3 pt-3 pb-2.5 sm:px-3.5 sm:pt-3.5 sm:pb-3">
                              <button
                                type="button"
                                onClick={() => toggleExpanded(item.session.id)}
                                className="w-full text-left flex flex-col gap-0.5 pr-12"
                              >
                                <p className={`font-sans ${cardText} text-cream-soft`}>
                                  {formatTimeRange(start, end)}
                                </p>
                                <div className="min-w-0">
                                  <h3 className="text-base font-semibold text-cream leading-snug">
                                    {item.template.title}
                                    <span className="font-normal text-cream-soft"> · {item.hostName}</span>
                                  </h3>
                                  {item.template.price > 0 && (
                                    <p className="font-sans text-xs text-cream-soft mt-0.5">${item.template.price}</p>
                                  )}
                                </div>
                              </button>
                              <div
                                className="pt-1.5 cursor-pointer"
                                onClick={() => toggleExpanded(item.session.id)}
                                onKeyDown={(e) => e.key === "Enter" && toggleExpanded(item.session.id)}
                                role="button"
                                tabIndex={0}
                              >
                                {(item.neighborhood || item.address) && (
                                  <p className={`italic ${cardText} text-cream-soft`}>
                                    {[item.neighborhood, item.address ? shortenAddress(item.address) : null].filter(Boolean).join(" · ")}
                                  </p>
                                )}
                                <p className={`italic ${cardText} text-cream-soft mt-0.5`}>
                                  {categoryLabel(item.template.category)}
                                  {availabilityUnknown
                                    ? " · Check page for availability"
                                    : (item.session.capacity >= 0
                                        ? ` · ${item.session.spotsLeft} of ${item.session.capacity} spots left`
                                        : ` · ${item.session.spotsLeft} spots left`)}
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(item.session.id)}
                                  className="font-sans text-xs font-medium text-cream-soft hover:text-cream transition underline"
                                >
                                  Hide details
                                </button>
                                <div className="flex items-center gap-2 ml-auto">
                                  {isFull && (
                                    <span className="font-sans bg-stone-warm/20 text-cream-soft text-xs font-medium px-2 py-0.5 shrink-0">
                                      Class full
                                    </span>
                                  )}
                                  {item.classUrl ? (
                                    <a
                                      href={item.classUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => { e.stopPropagation(); posthog.capture("book_class_clicked", { session_id: item.session.id, class_title: item.template.title, category: item.template.category, price: item.template.price, neighborhood: item.neighborhood, host_name: item.hostName, is_full: isFull }) }}
                                      className={`font-sans ${cardText} font-medium text-cream-soft underline hover:text-cream transition`}
                                    >
                                      Book
                                    </a>
                                  ) : item.sourceSlug ? (
                                    <Link
                                      href={`/studios/${item.sourceSlug}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`font-sans ${cardText} font-medium text-cream-soft underline hover:text-cream transition`}
                                    >
                                      Studio
                                    </Link>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.session.id, item)}
                            className="w-full text-left px-3 pt-3 pb-0 sm:px-3.5 sm:pt-3.5 flex flex-col gap-0.5 pr-12"
                          >
                            <p className={`font-sans ${cardText} text-cream-soft`}>
                              {formatTimeRange(start, end)}
                            </p>
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-cream leading-snug">
                                {item.template.title}
                                <span className="font-normal text-cream-soft"> · {item.hostName}</span>
                              </h3>
                              {item.template.price > 0 && (
                                <p className="font-sans text-xs text-cream-soft mt-0.5">${item.template.price}</p>
                              )}
                            </div>
                          </button>
                          {expanded && (
                            <div
                              className="px-3 pt-1.5 sm:px-3.5"
                              onClick={() => toggleExpanded(item.session.id)}
                              onKeyDown={(e) => e.key === "Enter" && toggleExpanded(item.session.id)}
                              role="button"
                              tabIndex={0}
                            >
                              {(item.neighborhood || item.address) && (
                                <p className={`italic ${cardText} text-cream-soft`}>
                                  {[item.neighborhood, item.address ? shortenAddress(item.address) : null].filter(Boolean).join(" · ")}
                                </p>
                              )}
                              <p className={`italic ${cardText} text-cream-soft mt-0.5`}>
                                {categoryLabel(item.template.category)}
                                {availabilityUnknown
                                  ? " · Check page for availability"
                                  : (item.session.capacity >= 0
                                      ? ` · ${item.session.spotsLeft} of ${item.session.capacity} spots left`
                                      : ` · ${item.session.spotsLeft} spots left`)}
                              </p>
                            </div>
                          )}
                          <div className={`flex items-center justify-between gap-2 px-3 pb-2.5 sm:px-3.5 sm:pb-3 ${expanded ? "pt-2 sm:pt-2" : "pt-0"}`}>
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.session.id)}
                              className="font-sans text-xs font-medium text-cream-soft hover:text-cream transition underline"
                            >
                              {expanded ? "Hide details" : "Details"}
                            </button>
                            <div className="flex items-center gap-2 ml-auto">
                              {isFull && (
                                <span className="font-sans bg-stone-warm/20 text-cream-soft text-xs font-medium px-2 py-0.5 shrink-0">
                                  Class full
                                </span>
                              )}
                              {item.classUrl ? (
                                <a
                                  href={item.classUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`font-sans ${cardText} font-medium text-cream-soft underline hover:text-cream transition`}
                                >
                                  Book
                                </a>
                              ) : item.sourceSlug ? (
                                <Link
                                  href={`/studios/${item.sourceSlug}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`font-sans ${cardText} font-medium text-cream-soft underline hover:text-cream transition`}
                                >
                                  Studio
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
              )}
            </section>
          )
        })}
      </div>

      {filterActive.has("favorites") && (
        <div className="border-t border-stone-warm/20 pt-6">
          <button
            type="button"
            onClick={() => { const next = !pastEventsExpanded; setPastEventsExpanded(next); if (next) posthog.capture("past_events_expanded", { past_count: pastFavorites.length }) }}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="font-sans text-sm font-medium text-cream-soft">
              Past events{pastFavorites.length > 0 ? ` (${pastFavorites.length})` : ""}
            </span>
            <span className={`font-sans text-cream-soft text-xs transition-transform ${pastEventsExpanded ? "rotate-180" : ""}`} aria-hidden>▼</span>
          </button>
          {pastEventsExpanded && (
            <div className="mt-4 space-y-6">
              {pastFavorites.length === 0 ? (
                <p className="font-sans text-sm text-cream-soft">
                  No past events in your favorites.
                </p>
              ) : (
                pastSortedDays.map((dayKey) => {
                  const dayItems = pastByDay.get(dayKey)!
                  const firstStart = new Date(dayItems[0].session.startTime)
                  return (
                    <section key={dayKey}>
                      <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-cream-soft mb-3">
                        {formatDay(firstStart)}
                      </h2>
                      <ul className="space-y-2">
                        {dayItems.map((item) => {
                          const start = new Date(item.session.startTime)
                          const end = new Date(item.session.endTime)
                          return (
                            <li
                              key={item.session.id}
                              className="border border-stone-warm/20 bg-claret-deep p-4 shadow-sm"
                            >
                              <p className={`font-sans ${cardText} text-cream-soft`}>
                                {formatTimeRange(start, end)}
                              </p>
                              <h3 className="text-base font-semibold text-cream mt-1">
                                {item.template.title}
                              </h3>
                              <p className={`italic ${cardText} text-cream-soft mt-0.5`}>
                                {item.sourceSlug ? (
                                  <Link href={`/studios/${item.sourceSlug}`} className="hover:underline">{item.hostName}</Link>
                                ) : item.hostName}
                                {item.address ? ` · ${shortenAddress(item.address)}` : ""}
                                {item.neighborhood ? ` · ${item.neighborhood}` : ""}
                              </p>
                              {item.classUrl ? (
                                <a href={item.classUrl} target="_blank" rel="noopener noreferrer" className="font-sans mt-2 inline-block text-sm font-medium text-cream-soft underline hover:text-cream transition">
                                  View class
                                </a>
                              ) : item.sourceSlug ? (
                                <Link href={`/studios/${item.sourceSlug}`} className="font-sans mt-2 inline-block text-sm font-medium text-cream-soft underline hover:text-cream transition">
                                  Studio page
                                </Link>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {filterActive.has("favorites") && savedIds.size > 0 && filtered.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => { posthog.capture("all_favorites_cleared", { cleared_count: savedIds.size }); setSavedIds(new Set()) }}
            className="font-sans text-sm font-medium text-cream-soft hover:text-cream underline"
          >
            Remove all
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="italic text-center text-cream-soft py-8">
          {filterActive.has("favorites")
            ? "You haven't saved any classes. Tap the heart icon to add a class to your favorites list."
            : "No sessions match. Try changing filters."}
        </p>
      )}
    </div>
  )
}
