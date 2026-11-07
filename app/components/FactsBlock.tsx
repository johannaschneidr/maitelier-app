import Link from "next/link"

export type Fact = {
  label: string
  value: string
  href?: string
  external?: boolean
}

/** Label/value pairs as a <dl>: the quotable facts block under the answer lead. Facts without a value are dropped. */
export function FactsBlock({ facts, title = "At a glance" }: { facts: (Fact | null | undefined | false)[]; title?: string }) {
  const rows = facts.filter((f): f is Fact => !!f && !!f.value)
  if (rows.length === 0) return null
  return (
    <section aria-label={title} className="mt-8 border border-stone-warm/20 bg-claret-deep">
      <h2 className="sr-only">{title}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((f) => (
          <div key={f.label} className="px-4 py-3 border-b border-stone-warm/10">
            <dt className="font-sans text-[11px] font-semibold uppercase tracking-wider text-cream-soft/70">{f.label}</dt>
            <dd className="mt-0.5 text-sm text-cream leading-snug">
              {f.href ? (
                f.external ? (
                  <a href={f.href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
                    {f.value}
                  </a>
                ) : (
                  <Link href={f.href} className="underline hover:opacity-80">
                    {f.value}
                  </Link>
                )
              ) : (
                f.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
