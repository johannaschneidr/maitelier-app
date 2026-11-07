import Link from "next/link"

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-sans text-[11px] text-cream-soft/70 mb-4">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-x-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-cream-soft">{item.name}</span>
            ) : (
              <Link href={item.path} className="hover:text-cream underline">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
