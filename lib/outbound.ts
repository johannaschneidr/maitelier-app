/**
 * Outbound link helpers. Every link to a studio's site goes through /go/[slug]
 * so the click is logged server-side (PostHog + Firestore counter) and UTM-tagged.
 */

/** Where on maitelier the click came from — becomes utm_campaign + PostHog `src`. */
export type OutboundSrc =
  | "home_card"
  | "detail_page"
  | "detail_schedule"
  | "detail_schedule_empty"
  | "past_favorite"
  | "ig_bio"
  | "newsletter"
  | "email"

/** Extra attributes for outbound <a> tags: keep search engines from following /go/ links. */
export const OUTBOUND_REL = "nofollow noopener noreferrer"

/**
 * Build a /go/ link. `classId` (ClassTemplate id) sends the user to that class's
 * booking page instead of the studio's booking page/website.
 */
export function outboundHref(slug: string, src: OutboundSrc, classId?: string): string {
  const params = new URLSearchParams({ src })
  if (classId) params.set("class", classId)
  return `/go/${encodeURIComponent(slug)}?${params}`
}
