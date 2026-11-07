import { NextRequest, NextResponse, after } from "next/server"
import { PostHog } from "posthog-node"
import { getSourceBySlug, getTemplateById, incrementOutboundClicks } from "@/lib/queries"

const POSTHOG_TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|preview|fetch|curl|wget/i

/** posthog-js stores its state in a `ph_<token>_posthog` cookie; reuse its distinct_id so server events join the browser session. */
function browserDistinctId(req: NextRequest): string | undefined {
  if (!POSTHOG_TOKEN) return undefined
  const raw = req.cookies.get(`ph_${POSTHOG_TOKEN}_posthog`)?.value
  if (!raw) return undefined
  try {
    const id = JSON.parse(raw)?.distinct_id
    return typeof id === "string" ? id : undefined
  } catch {
    return undefined
  }
}

function withUtm(url: string, src: string): URL | null {
  try {
    const dest = new URL(url)
    if (dest.protocol !== "http:" && dest.protocol !== "https:") return null
    dest.searchParams.set("utm_source", "maitelier")
    dest.searchParams.set("utm_medium", "referral")
    dest.searchParams.set("utm_campaign", src)
    return dest
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const src = req.nextUrl.searchParams.get("src") ?? "unknown"
  const classId = req.nextUrl.searchParams.get("class")

  const source = await getSourceBySlug(slug)
  if (!source) return NextResponse.redirect(new URL("/", req.url))

  // Only follow a class URL if that class belongs to this studio — destinations always come from our DB, never the query string.
  const template = classId ? await getTemplateById(classId) : null
  const classUrl = template?.sourceId === source.id ? template.url : undefined
  const rawDest = classUrl ?? source.bookingUrl ?? source.website
  const dest = rawDest ? withUtm(rawDest, src) : null
  if (!dest) return NextResponse.redirect(new URL(`/studios/${slug}`, req.url))

  const isBot = BOT_UA.test(req.headers.get("user-agent") ?? "")
  if (!isBot) {
    const distinctId = browserDistinctId(req)
    const referrer = req.headers.get("referer") ?? undefined

    // Log after the redirect is sent so tracking never slows the user down.
    after(async () => {
      const tasks: Promise<unknown>[] = [incrementOutboundClicks(source.id)]
      if (POSTHOG_TOKEN) {
        const posthog = new PostHog(POSTHOG_TOKEN, { host: POSTHOG_HOST, flushAt: 1, flushInterval: 0 })
        posthog.capture({
          distinctId: distinctId ?? crypto.randomUUID(),
          event: "studio_outbound_click",
          properties: {
            studio_id: source.id,
            studio_slug: slug,
            studio_name: source.name,
            src,
            class_id: classUrl ? template?.id : undefined,
            dest_type: classUrl ? "class" : source.bookingUrl ? "booking" : "website",
            dest: dest.toString(),
            $referrer: referrer,
            ...(!distinctId && { $process_person_profile: false }),
          },
        })
        tasks.push(posthog.shutdown())
      }
      const results = await Promise.allSettled(tasks)
      for (const r of results) {
        if (r.status === "rejected") console.error("[go] outbound tracking failed:", r.reason)
      }
    })
  }

  return NextResponse.redirect(dest, 302)
}
