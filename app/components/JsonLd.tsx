import { jsonLdString } from "@/lib/jsonld"

/** Server-rendered JSON-LD, so fetchers that don't run JavaScript still see it. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
}
