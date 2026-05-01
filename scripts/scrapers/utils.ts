/**
 * Shared utilities for scrapers.
 * - Respectful fetching (delays, User-Agent)
 * - HTML parsing helpers
 */

const USER_AGENT = "CraftPass/1.0 (https://craftpass.app; contact for scraping policy)"

/** Default delay between requests in ms */
const DEFAULT_DELAY_MS = 1500

/**
 * Fetch a URL with a respectful User-Agent.
 * Use fetchWithDelay for rate limiting.
 */
export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  })
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status}: ${url}`)
  }
  return res.text()
}

/**
 * Wait for a delay (rate limiting between requests).
 */
export function delay(ms: number = DEFAULT_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch HTML and wait before returning (respectful scraping).
 */
export async function fetchWithDelay(url: string, delayMs: number = DEFAULT_DELAY_MS): Promise<string> {
  const html = await fetchHtml(url)
  await delay(delayMs)
  return html
}

/**
 * Parse a price string like "$65" or "65" or "Free" into a number.
 */
export function parsePrice(text: string | null | undefined): number {
  if (!text || text.toLowerCase().includes("free")) return 0
  const match = text.replace(/[^0-9.]/g, "").match(/\d+\.?\d*/)
  return match ? parseFloat(match[0]) : 0
}

/**
 * Infer NYC neighborhood from address when possible.
 * Uses common address patterns; returns undefined when unknown.
 */
export function inferNeighborhoodFromAddress(address: string | undefined, venueName?: string): string | undefined {
  const text = `${address ?? ""} ${venueName ?? ""}`.toLowerCase()
  if (!text.trim()) return undefined
  // Address/venue patterns → neighborhood (order matters for specificity)
  const patterns: [RegExp, string][] = [
    [/gramercy|gramercy\s*pk/i, "Gramercy Park"],
    [/fifth\s*ave.*82nd|82nd.*fifth|metropolitan\s*museum|met\s*museum/i, "Upper East Side"],
    [/fifth\s*ave|upper\s*east/i, "Upper East Side"],
    [/upper\s*west|79th|80th|81st|82nd|83rd|84th|85th|86th|87th|88th|89th|90th/i, "Upper West Side"],
    [/williamsburg|bedford\s*ave|n\s*6th|n\s*7th.*brooklyn/i, "Williamsburg"],
    [/dumbo|water\s*st.*brooklyn|brooklyn\s*bridge/i, "DUMBO"],
    [/gowanus|3rd\s*ave.*brooklyn|nevins/i, "Gowanus"],
    [/bushwick|flushing\s*ave.*brooklyn/i, "Bushwick"],
    [/greenpoint|manhattan\s*ave.*brooklyn|nassau\s*ave/i, "Greenpoint"],
    [/flatiron|madison\s*sq|23rd\s*st.*broadway/i, "Flatiron"],
    [/soho|so\s*ho|broadway.*prince|prince\s*st/i, "SoHo"],
    [/tribeca|tribecca|hudson\s*st.*downtown/i, "Tribeca"],
    [/chelsea|chelsea\s*piers|10th\s*ave.*chelsea/i, "Chelsea"],
    [/east\s*village|st\s*marks|2nd\s*ave.*e\s*\d/i, "East Village"],
    [/west\s*village|greenwich\s*ave|bleecker\s*st/i, "West Village"],
    [/nolita|mulberry\s*st.*little\s*italy/i, "Nolita"],
    [/lower\s*east\s*side|les|delancey|orchard\s*st/i, "Lower East Side"],
    [/chinatown|mott\s*st|canal\s*st.*chinatown/i, "Chinatown"],
    [/financial\s*district|wall\s*st|broad\s*st/i, "Financial District"],
  ]
  for (const [re, hood] of patterns) {
    if (re.test(text)) return hood
  }
  return undefined
}

/**
 * Parse duration string like "2 hours" or "90 min" into minutes.
 */
export function parseDurationToMinutes(text: string | null | undefined): number | undefined {
  if (!text) return undefined
  const lower = text.toLowerCase()
  const hourMatch = lower.match(/(\d+)\s*h(?:our)?s?/)
  const minMatch = lower.match(/(\d+)\s*m(?:in)?s?/)
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0
  const mins = minMatch ? parseInt(minMatch[1], 10) : 0
  return hours * 60 + mins || undefined
}
