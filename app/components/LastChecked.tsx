import { formatRelative } from "@/lib/format"

/** "Schedule checked 3 hours ago" — shown on every page that lists sessions. */
export function LastChecked({ at }: { at?: Date }) {
  if (!at) return null
  return (
    <p className="font-sans mt-3 text-[11px] text-cream-soft/70">
      Schedule checked <time dateTime={at.toISOString()}>{formatRelative(at)}</time>
    </p>
  )
}
