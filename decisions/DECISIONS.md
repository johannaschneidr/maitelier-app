# Technical Decisions — CraftPass

## Active Constraints

<!-- Things the agent must always respect. Changing these requires explicit user confirmation. -->

- Firebase client SDK only (no Admin SDK) — all Firestore access goes through `lib/firebase.ts` + `lib/queries.ts`
- No authentication system yet — do not add auth, user sessions, or protected routes
- No new npm dependencies without asking — keep the bundle lean
- `Source` collection must not be cleared by scraper scripts — it holds Places API data seeded separately
- Scrapers run as local scripts (`tsx`), not as server-side API routes or serverless functions
- `slug` is the stable public identifier for studios — used in URLs and Firestore lookups; never change a slug once seeded

---

## Technical Decisions

<!-- What was chosen and why, one line each -->

- **Next.js App Router** — chosen over Pages Router for server components and simpler data fetching
- **Firebase Firestore (client SDK)** — chosen for zero-backend MVP; no server needed for reads
- **Tailwind CSS v4** — project was initialized with v4; do not downgrade or mix v3 patterns
- **`tsx` for scripts** — simpler than `ts-node`; all seed/scrape scripts use `npx tsx`
- **Google Places API v1** (`places.googleapis.com/v1`) — used for studio enrichment (address, photo, coordinates); key in `.env.local`
- **Shopify `products.json`** — public endpoint, no auth required; preferred over HTML scraping for Shopify stores
- **`externalId` for deduplication** — scraped sessions carry the source's own ID to prevent duplicates on re-run
- **`scrapeEnabled` flag** — on `SourceConfig` to distinguish working scrapers from stubs; do not remove stubs, just leave flag false
- **PostHog** — analytics; already wired via wizard, events fired from `ScheduleView.tsx`

---

## Naming & Conventions

- Collections: `PascalCase` (`Source`, `ClassTemplate`, `ClassSession`, `StudioInstructor`, `UserSavedClass`)
- Studio slugs: `kebab-case`, derived from studio name (e.g. `brooklyn-brainery`)
- Scraper files: `scripts/scrapers/[platform].ts`
- Source config: `scripts/config/sources.ts` — single source of truth for all studios
- Types: `types/db.ts` (Firestore shapes), `types/schedule.ts` (UI display shape), `types/scraped.ts` (scraper output)
- `ScheduleItem` is the serializable bridge between server components and `ScheduleView` client component — dates are ISO strings

---

## Out of Scope

<!-- Explicitly decided against — do not re-suggest these -->

- **Luma / Eventbrite scraping** — potential competitor conflict; decided against
- **Meetup scraping** — low studio density, not worth maintaining
- **Makeville** — all classes are multi-day intensive courses (Mon–Thu format); not compatible with individual-session model; revisit if they add single-session workshops
- **MakerSpace NYC** — class listing page links out to Eventbrite per-class for booking; no self-hosted schedule to scrape
- **FareHarbor scraping** — requires registered partner API key; no public endpoint
- **Acuity Scheduling scraping** — JS-rendered, requires Playwright; deferred
- **Playwright / headless browser** — not installed; don't add for MVP
- **Secret Riso Club** — removed; workshop dates only in individual event detail pages, not listing; site returning 503
- **Wick & Pour** — removed; quality bar not met
- **NY Cake Academy, Atelier Sucré** — removed; baking/pastry focus is out of scope for now; re-evaluate if platform expands to food
- **Creatively Wild** — removed; mixes semester-based courses with individual classes, making scraping unreliable; revisit if they separate offerings
- **Semester-based / multi-week courses** — not supported; platform focuses on individual bookable sessions only; studios that mix both formats are acceptable only if the individual sessions are clearly separated and scrapeable
- **Server-side API routes for Firestore** — client SDK is sufficient for current scale
- **Separate landing page** — schedule is the homepage for MVP; landing page is a post-launch concern
- **User accounts / saved classes in DB** — favorites use `localStorage` only for now
