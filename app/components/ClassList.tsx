import Link from "next/link"
import type { ClassView } from "@/lib/catalog"
import { durationAdjective, formatPrice, formatShortDate, formatTime } from "@/lib/format"
import { getCraft } from "@/lib/taxonomy/crafts"

type Props = {
  classes: ClassView[]
  /** Show the studio name and neighborhood on each row (hub pages). */
  showStudio?: boolean
}

/** Classes with their next session date visible, each linking to its Class page. */
export function ClassList({ classes, showStudio = false }: Props) {
  if (classes.length === 0) return null
  return (
    <ul className="space-y-2">
      {classes.map((c) => {
        const next = c.sessions[0]
        const meta = [
          showStudio ? [c.studio.name, c.studio.neighborhood].filter(Boolean).join(", ") : getCraft(c.craft)?.label,
          c.durationMin > 0 ? durationAdjective(c.durationMin) : "",
          c.price > 0 ? formatPrice(c.price) : "",
        ].filter(Boolean)
        return (
          <li key={c.slug} className="border border-stone-warm/20 bg-claret-deep px-3.5 py-3 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <Link href={`/classes/${c.slug}`} className="text-base font-semibold text-cream leading-snug hover:underline">
                {c.title}
              </Link>
              <p className="font-sans text-xs text-cream-soft mt-0.5">{meta.join(" · ")}</p>
            </div>
            <p className="font-sans text-xs text-cream-soft shrink-0 text-right">
              {next ? (
                <>
                  Next: <time dateTime={next.start.toISOString()}>{formatShortDate(next.start)}, {formatTime(next.start)}</time>
                </>
              ) : (
                <span className="italic text-cream-soft/70">No dates yet</span>
              )}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
