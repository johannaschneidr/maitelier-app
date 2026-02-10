"use client"

import { useMemo, useState } from "react"
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

function formatTimeRange(start: Date, end: Date): string {
  const s = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()
  const e = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()
  return `${s} - ${e}`
}

function formatStartTime(start: Date): string {
  return start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()
}

function formatTimeAndDuration(start: Date, end: Date, durationMin: number): string {
  return `${formatTimeRange(start, end)} (${formatDuration(durationMin)})`
}

function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

const cardText = "text-sm leading-snug"

type FilterId = "afterWork" | "weekendMorning" | "under75" | "forTwo" | "twoHoursOrLess" | "favorites"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "afterWork", label: "After work (6–9pm)" },
  { id: "weekendMorning", label: "Weekend morning" },
  { id: "under75", label: "Under $75" },
  { id: "forTwo", label: "For 2 people" },
  { id: "twoHoursOrLess", label: "2 hours or less" },
  { id: "favorites", label: "My favorites" }
]

function applyFilters(
  items: ScheduleItem[],
  active: Set<FilterId>,
  selectedNeighborhoods: Set<string>,
  selectedDates: Set<string>,
  savedIds: Set<string>
): ScheduleItem[] {
  return items.filter((item) => {
    const start = new Date(item.session.startTime)
    const dateKey = start.toDateString()
    const hour = start.getHours()
    const day = start.getDay()
    const isWeekend = day === 0 || day === 6
    const isWeekendMorning = isWeekend && hour >= 8 && hour < 12
    const isAfterWork = hour >= 18 && hour < 21
    const under75 = item.template.price <= 75
    const forTwo = item.session.spotsLeft >= 2
    const twoHoursOrLess = item.template.durationMin <= 120

    if (selectedDates.size > 0 && !selectedDates.has(dateKey)) return false
    if (active.has("favorites") && !savedIds.has(item.session.id)) return false
    if (active.has("afterWork") && !isAfterWork) return false
    if (active.has("weekendMorning") && !isWeekendMorning) return false
    if (active.has("under75") && !under75) return false
    if (active.has("forTwo") && !forTwo) return false
    if (active.has("twoHoursOrLess") && !twoHoursOrLess) return false
    if (selectedNeighborhoods.size > 0 && (!item.neighborhood || !selectedNeighborhoods.has(item.neighborhood))) return false
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
  const [neighborhoodDropdownOpen, setNeighborhoodDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [minimalView, setMinimalView] = useState(false)
  const [pastEventsExpanded, setPastEventsExpanded] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const neighborhoods = useMemo(
    () => [...new Set(items.map((i) => i.neighborhood).filter((n): n is string => Boolean(n)))].sort(),
    [items]
  )

  const availableDates = useMemo(
    () => [...new Set(items.map((i) => new Date(i.session.startTime).toDateString()))].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [items]
  )

  const filtered = useMemo(
    () => applyFilters(items, filterActive, selectedNeighborhoods, selectedDates, savedIds),
    [items, filterActive, selectedNeighborhoods, selectedDates, savedIds]
  )
  const fromToday = useMemo(() => {
    const startOfToday = getStartOfToday()
    return filtered.filter((item) => new Date(item.session.startTime) >= startOfToday)
  }, [filtered])
  const byDay = useMemo(() => groupByDay(fromToday), [fromToday])
  const sortedDays = useMemo(() => {
    const startOfToday = getStartOfToday()
    const keys = Array.from(byDay.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    const minDate = startOfToday.getTime()
    const maxDate = keys.length > 0 ? new Date(keys[keys.length - 1]).getTime() : minDate
    const allDates: string[] = []
    for (let t = minDate; t <= maxDate; t += 24 * 60 * 60 * 1000) {
      allDates.push(new Date(t).toDateString())
    }
    return allDates
  }, [byDay])

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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleNeighborhood = (n: string) => {
    setSelectedNeighborhoods((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  const toggleDate = (dateKey: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateKey)) next.delete(dateKey)
      else next.add(dateKey)
      return next
    })
  }

  function formatDateForDropdown(dateKey: string): string {
    const d = new Date(dateKey)
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const toggleSave = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  const toggleExpanded = (sessionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: Minimal view toggle, right-aligned */}
      <div className="flex justify-end">
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Minimal view</span>
          <button
            type="button"
            role="switch"
            aria-checked={minimalView}
            onClick={() => setMinimalView((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 ${
              minimalView ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white dark:bg-zinc-900 shadow ring-0 transition-transform mt-0.5 ml-0.5 ${
                minimalView ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Filter row: chips + Neighborhood + Date */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = filterActive.has(f.id)
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggleFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              }`}
            >
              {f.label}
            </button>
          )
        })}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setDateDropdownOpen(false); setNeighborhoodDropdownOpen((o) => !o) }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition border ${
              selectedNeighborhoods.size > 0
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent"
                : "bg-transparent border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500"
            }`}
          >
            Neighborhood{selectedNeighborhoods.size > 0 ? ` (${selectedNeighborhoods.size})` : ""}
          </button>
          {neighborhoodDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setNeighborhoodDropdownOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg">
                {neighborhoods.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-500">No neighborhoods</p>
                ) : (
                  <>
                    {selectedNeighborhoods.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedNeighborhoods(new Set())}
                        className="w-full px-3 py-1.5 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Remove all
                      </button>
                    )}
                    {neighborhoods.map((n) => (
                      <label key={n} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <input type="checkbox" checked={selectedNeighborhoods.has(n)} onChange={() => toggleNeighborhood(n)} className="rounded border-zinc-300 dark:border-zinc-600" />
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
            onClick={() => { setNeighborhoodDropdownOpen(false); setDateDropdownOpen((o) => !o) }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition border ${
              selectedDates.size > 0
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent"
                : "bg-transparent border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500"
            }`}
          >
            Date{selectedDates.size > 0 ? ` (${selectedDates.size})` : ""}
          </button>
          {dateDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" aria-hidden onClick={() => setDateDropdownOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg">
                {availableDates.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-500">No dates</p>
                ) : (
                  <>
                    {selectedDates.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDates(new Set())}
                        className="w-full px-3 py-1.5 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Remove all
                      </button>
                    )}
                    {availableDates.map((dateKey) => (
                      <label key={dateKey} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <input type="checkbox" checked={selectedDates.has(dateKey)} onChange={() => toggleDate(dateKey)} className="rounded border-zinc-300 dark:border-zinc-600" />
                        {formatDateForDropdown(dateKey)}
                      </label>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card list, grouped by day (today onward; show "No classes" for empty dates) */}
      <div className="space-y-8">
        {sortedDays.map((dayKey) => {
          const dayItems = byDay.get(dayKey) ?? []
          return (
            <section key={dayKey}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                {formatDayLabel(dayKey)}
              </h2>
              {dayItems.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">No classes</p>
              ) : (
              <ul className="space-y-2">
                {dayItems.map((item) => {
                  const start = new Date(item.session.startTime)
                  const end = new Date(item.session.endTime)
                  const saved = savedIds.has(item.session.id)
                  const expanded = expandedIds.has(item.session.id)
                  const isFull = item.session.spotsLeft === 0
                  return (
                    <li
                      key={item.session.id}
                      className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
                    >
                      {/* Heart icon: top right (same position in both modes) */}
                      <button
                        type="button"
                        onClick={(e) => toggleSave(e, item.session.id)}
                        className={`absolute top-1.5 right-2 p-1.5 rounded-md transition shrink-0 z-10 ${saved ? "text-red-500" : "text-zinc-400 hover:text-red-500"}`}
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
                              onClick={() => toggleExpanded(item.session.id)}
                              className="w-full text-left px-3 py-3 sm:px-3.5 sm:py-3.5 flex items-center gap-2 pr-12 min-w-0"
                            >
                              <span className={`${cardText} text-zinc-500 dark:text-zinc-500 shrink-0`}>
                                {formatStartTime(start)}
                              </span>
                              <span className={`${cardText} font-semibold text-zinc-900 dark:text-zinc-100 truncate min-w-0`}>
                                {item.template.title}
                              </span>
                              {item.template.price > 0 && (
                                <span className={`${cardText} text-zinc-600 dark:text-zinc-400 shrink-0 ml-auto`}>
                                  ${item.template.price}
                                </span>
                              )}
                            </button>
                          ) : (
                            <div className="px-3 pt-3 pb-2.5 sm:px-3.5 sm:pt-3.5 sm:pb-3">
                              <button
                                type="button"
                                onClick={() => toggleExpanded(item.session.id)}
                                className="w-full text-left flex flex-col gap-0.5 pr-12"
                              >
                                <p className={`${cardText} text-zinc-500 dark:text-zinc-500`}>
                                  {formatTimeRange(start, end)}
                                </p>
                                <div className="min-w-0">
                                  <h3 className={`${cardText} text-zinc-900 dark:text-zinc-100`}>
                                    <span className="font-semibold">{item.template.title}</span>
                                    <span className="font-normal text-zinc-600 dark:text-zinc-400">
                                      {" · "}
                                      {categoryLabel(item.template.category)}
                                      {item.template.price > 0 && ` · $${item.template.price}`}
                                    </span>
                                  </h3>
                                </div>
                              </button>
                              <div
                                className="pt-1.5 cursor-pointer"
                                onClick={() => toggleExpanded(item.session.id)}
                                onKeyDown={(e) => e.key === "Enter" && toggleExpanded(item.session.id)}
                                role="button"
                                tabIndex={0}
                              >
                                <p className={`${cardText} text-zinc-500 dark:text-zinc-500`}>
                                  {item.hostName}
                                  {item.neighborhood ? `, ${item.neighborhood}` : ""}
                                </p>
                                <p className={`${cardText} text-zinc-500 dark:text-zinc-500 mt-1`}>
                                  {item.session.spotsLeft} of {item.session.capacity} spots left
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(item.session.id)}
                                  className={`${cardText} font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition underline`}
                                >
                                  See less
                                </button>
                                <div className="flex items-center gap-2 ml-auto">
                                  {isFull && (
                                    <span className="rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium px-2 py-0.5 shrink-0">
                                      Class full
                                    </span>
                                  )}
                                  <Link
                                    href={`/sessions/${item.session.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`${cardText} font-medium rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 hover:opacity-90 transition shrink-0 inline-flex items-center gap-1.5`}
                                  >
                                    {isFull ? "Studio page" : "Book"}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
                                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                                    </svg>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.session.id)}
                            className="w-full text-left px-3 pt-3 pb-0 sm:px-3.5 sm:pt-3.5 flex flex-col gap-0.5 pr-12"
                          >
                            <p className={`${cardText} text-zinc-500 dark:text-zinc-500`}>
                              {formatTimeRange(start, end)}
                            </p>
                            <div className="min-w-0">
                              <h3 className={`${cardText} text-zinc-900 dark:text-zinc-100`}>
                                <span className="font-semibold">{item.template.title}</span>
                                <span className="font-normal text-zinc-600 dark:text-zinc-400">
                                  {" · "}
                                  {categoryLabel(item.template.category)}
                                  {item.template.price > 0 && ` · $${item.template.price}`}
                                </span>
                              </h3>
                            </div>
                          </button>
                          {expanded && (
                            <div
                              className="px-3 pt-1.5 sm:px-3.5 py-1 sm:py-0.5"
                              onClick={() => toggleExpanded(item.session.id)}
                              onKeyDown={(e) => e.key === "Enter" && toggleExpanded(item.session.id)}
                              role="button"
                              tabIndex={0}
                            >
                              <p className={`${cardText} text-zinc-500 dark:text-zinc-500`}>
                                {item.hostName}
                                {item.neighborhood ? `, ${item.neighborhood}` : ""}
                              </p>
                              <p className={`${cardText} text-zinc-500 dark:text-zinc-500 mt-1`}>
                                {item.session.spotsLeft} of {item.session.capacity} spots left
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 px-3 pb-2.5 sm:px-3.5 sm:pb-3 pt-0">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.session.id)}
                              className={`${cardText} font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition underline`}
                            >
                              {expanded ? "See less" : "See more"}
                            </button>
                            <div className="flex items-center gap-2 ml-auto">
                              {isFull && (
                                <span className="rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium px-2 py-0.5 shrink-0">
                                  Class full
                                </span>
                              )}
                              <Link
                                href={`/sessions/${item.session.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`${cardText} font-medium rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 hover:opacity-90 transition shrink-0 inline-flex items-center gap-1.5`}
                              >
                                {isFull ? "Studio page" : "Book"}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
                                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                                </svg>
                              </Link>
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
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <button
            type="button"
            onClick={() => setPastEventsExpanded((e) => !e)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Past events{pastFavorites.length > 0 ? ` (${pastFavorites.length})` : ""}
            </span>
            <span className={`text-zinc-400 dark:text-zinc-500 text-xs transition-transform ${pastEventsExpanded ? "rotate-180" : ""}`} aria-hidden>▼</span>
          </button>
          {pastEventsExpanded && (
            <div className="mt-4 space-y-6">
              {pastFavorites.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  No past events in your favorites.
                </p>
              ) : (
                pastSortedDays.map((dayKey) => {
                  const dayItems = pastByDay.get(dayKey)!
                  const firstStart = new Date(dayItems[0].session.startTime)
                  return (
                    <section key={dayKey}>
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                        {formatDay(firstStart)}
                      </h2>
                      <ul className="space-y-2">
                        {dayItems.map((item) => {
                          const start = new Date(item.session.startTime)
                          const end = new Date(item.session.endTime)
                          return (
                            <li
                              key={item.session.id}
                              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
                            >
                              <p className={`${cardText} text-zinc-500 dark:text-zinc-500`}>
                                {formatTimeRange(start, end)}
                              </p>
                              <h3 className={`${cardText} font-semibold text-zinc-900 dark:text-zinc-100 mt-1`}>
                                {item.template.title}
                              </h3>
                              <p className={`${cardText} text-zinc-600 dark:text-zinc-400 mt-0.5`}>
                                {item.hostName}
                                {item.neighborhood ? `, ${item.neighborhood}` : ""}
                              </p>
                              <Link
                                href={`/sessions/${item.session.id}`}
                                className="mt-2 inline-block text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:underline"
                              >
                                View session →
                              </Link>
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
            onClick={() => setSavedIds(new Set())}
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
          >
            Remove all
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-zinc-500 dark:text-zinc-500 py-8">
          {filterActive.has("favorites")
            ? "You haven't saved any classes. Tap the heart icon to add a class to your favorites list."
            : "No sessions match. Try changing filters."}
        </p>
      )}
    </div>
  )
}
