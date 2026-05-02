"use client"

import { useState } from "react"

export type ScheduleRow = {
  id: string
  dateTimeLabel: string
  title: string
  category: string
  price: number
  capacity: number
  spotsLeft: number
  bookUrl: string | undefined
}

const INITIAL_COUNT = 3

type Props = {
  rows: ScheduleRow[]
  fallbackUrl?: string
}

export function ScheduleList({ rows, fallbackUrl }: Props) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? rows : rows.slice(0, INITIAL_COUNT)
  const hidden = rows.length - INITIAL_COUNT

  if (rows.length === 0) {
    return (
      <div className="border border-stone-warm/20 bg-claret-deep p-6 font-sans text-xs text-cream-soft">
        No upcoming classes listed.
        {fallbackUrl && (
          <>
            {" "}Check{" "}
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
              their schedule
            </a>{" "}
            for availability.
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <ul className="space-y-2">
        {visible.map((row) => {
          const isFull = row.spotsLeft === 0
          const availabilityUnknown = row.capacity < 0 || row.spotsLeft < 0
          return (
            <li
              key={row.id}
              className="border border-stone-warm/20 bg-claret-deep px-3.5 py-3 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-sans text-xs text-cream-soft">{row.dateTimeLabel}</p>
                <p className="text-base font-semibold text-cream leading-snug mt-0.5">{row.title}</p>
                {row.price > 0 && (
                  <p className="font-sans text-xs text-cream-soft mt-0.5">${row.price}</p>
                )}
                {availabilityUnknown ? (
                  <p className="font-sans text-xs text-cream-soft mt-0.5 italic">Check page for availability</p>
                ) : (
                  <p className="font-sans text-xs text-cream-soft mt-0.5">
                    {row.spotsLeft} of {row.capacity} spots left
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isFull && (
                  <span className="font-sans bg-stone-warm/20 text-cream text-xs font-medium px-2 py-0.5">
                    Full
                  </span>
                )}
                {row.bookUrl && (
                  <a
                    href={row.bookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-xs font-medium text-cream underline hover:text-cream transition"
                  >
                    Book
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {rows.length > INITIAL_COUNT && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="font-sans mt-4 text-xs font-medium text-cream-soft hover:text-cream transition underline"
        >
          {showAll ? "Hide" : `Show ${hidden} more`}
        </button>
      )}
    </div>
  )
}
