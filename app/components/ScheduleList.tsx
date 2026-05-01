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
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-500 dark:text-zinc-400">
        No upcoming classes listed.
        {fallbackUrl && (
          <>
            {" "}Check{" "}
            <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">
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
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-3 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm text-zinc-500 dark:text-zinc-500">{row.dateTimeLabel}</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug mt-0.5">
                  {row.title}
                  <span className="font-normal text-zinc-500 dark:text-zinc-400">
                    {" · "}{row.category}
                    {row.price > 0 && ` · $${row.price}`}
                  </span>
                </p>
                {!availabilityUnknown && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {row.spotsLeft} of {row.capacity} spots left
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isFull && (
                  <span className="rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium px-2 py-0.5">
                    Full
                  </span>
                )}
                {row.bookUrl && (
                  <a
                    href={row.bookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 hover:opacity-90 transition inline-flex items-center gap-1.5"
                  >
                    Book
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
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
          className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          {showAll ? "Hide" : `Show ${hidden} more`}
        </button>
      )}
    </div>
  )
}
