# CraftPass — CLAUDE.md

## What We're Building

CraftPass is a **workshop discovery platform for NYC** that aggregates creative classes (ceramics, woodworking, painting, etc.) from 50+ venues and platforms (Eventbrite, Meetup, Luma, Shopify, independent sites). Users can browse, filter, and save upcoming workshops.

Current stage: **scraper foundation built**, with 4 working scrapers (shopify, brainery, resobox, urbanglass) and studio detail pages live.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| Database | Firebase Firestore (`craftpass-f2322`) |
| Data ingestion | Custom scrapers + Cheerio, tsx scripts |
| Dev tooling | ESLint 9, ts-node |

---

## Project Structure

```
craftpass-app/
├── app/
│   ├── components/
│   │   └── ScheduleView.tsx    # Main UI component (2000+ lines, stateful)
│   ├── studios/
│   │   ├── page.tsx            # /studios — grid of all studios
│   │   └── [slug]/page.tsx     # /studios/[slug] — studio detail + upcoming classes
│   ├── globals.css             # Tailwind global styles + dark mode
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page — fetches data, builds ScheduleItem[]
├── lib/
│   ├── firebase.ts             # Firebase init and exports
│   ├── places.ts               # Google Places API helpers
│   └── queries.ts              # Firestore query functions
├── scripts/
│   ├── config/
│   │   └── sources.ts          # All configured studio sources (scrapeEnabled flag)
│   ├── scrapers/
│   │   ├── shopify.ts          # Shopify products.json scraper
│   │   ├── brainery.ts         # Brooklyn Brainery custom scraper
│   │   ├── resobox.ts          # ResoBox custom scraper
│   │   ├── urbanglass.ts       # UrbanGlass custom scraper
│   │   ├── example-custom.ts   # Template for new custom scrapers
│   │   └── utils.ts            # fetchHtml, parsePrice, parseDuration, etc.
│   ├── importers/
│   │   └── import-to-firebase.ts  # ScrapedClass[] → Firestore
│   ├── run-scrape-and-import.ts   # Scraper orchestrator (called by npm run scrape)
│   ├── remove-source.ts           # Remove a source and its data from Firestore
│   ├── seed.ts                 # Single workshop seed
│   └── seed-dev-data.ts        # 30+ sessions across 3 sources (dev/test)
├── types/
│   ├── db.ts                   # Firestore document types
│   ├── schedule.ts             # ScheduleItem display type
│   └── scraped.ts              # ScrapedClass scraper output type
└── public/                     # Static assets
```

---

## Data Flow

```
Scrapers (eventbrite/meetup/luma/shopify/custom)
  → ScrapedClass[]
  → import-to-firebase.ts
  → Firestore (Source → ClassTemplate → ClassSession)
  → lib/queries.ts
  → app/page.tsx (server component, builds ScheduleItem[])
  → ScheduleView.tsx (client component, filters + renders)
```

---

## Firestore Collections

- **Source** — studios and platforms (name, type, neighborhood, address)
- **ClassTemplate** — reusable workshop definitions (title, category, price, durationMin)
- **ClassSession** — scheduled instances (startTime, endTime, capacity, spotsLeft)
- **StudioInstructor** — instructor profiles (name, bio, imageUrl)
- **UserSavedClass** — user favorites (userId, sessionId)

---

## Key Scripts

```bash
npm run dev                        # Next.js dev server (localhost:3000)
npm run seed                       # One-off single-workshop seed
npm run seed:dev                   # Rich dev data: 30+ sessions over 3 weeks
npm run scrape [name]              # Run a single scraper (brainery/resobox/urbanglass/shopify)
npm run scrape all                 # Run all enabled scrapers
npm run scrape [name] -- --clear   # Clear ClassSession/ClassTemplate/StudioInstructor first, then import
```

---

## UI Features (ScheduleView.tsx)

- **Filters**: after-work, weekend morning, under $75, for 2+ people, ≤2 hours, favorites
- **Neighborhood selector**: dropdown filter by NYC neighborhood
- **Date picker**: multi-select calendar
- **Minimal view toggle**: compact vs. expanded card layouts
- **Favorites**: heart button, persisted in `localStorage`
- **Past sessions**: view previously bookmarked sessions
- **Dark mode**: full Tailwind dark mode support

---

## Adding New Scrapers

1. Add source config to `scripts/config/sources.ts`
2. Create scraper in `scripts/scrapers/[platform].ts` (see `example-custom.ts`)
3. Register in `scripts/run-scrape-and-import.ts`
4. Run: `npm run scrape [platform]`

Shared utils in `scripts/scrapers/utils.ts`: `fetchHtml`, `fetchWithDelay` (1.5s rate limit), `parsePrice`, `parseDurationToMinutes`, `inferNeighborhoodFromAddress`.

---

## Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).
