"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Schedule" },
  { href: "/studios", label: "Studios" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-warm/20 bg-claret-deep">
      <div className="mx-auto max-w-6xl px-6 md:px-10 flex items-center gap-6 h-12">
        <Link href="/" className="font-display italic text-cream text-base">maitelier.</Link>
        {links.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`font-sans text-xs transition ${
                active
                  ? "text-cream font-medium"
                  : "text-cream-soft hover:text-cream"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
