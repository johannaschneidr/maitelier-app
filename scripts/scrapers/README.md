# Scrapers

Scrapers fetch class/workshop data from external sites and output `ScrapedClass[]`. The importer writes them to Firebase.

## Structure

- **`utils.ts`** – Shared fetch (with delay, User-Agent), `parsePrice`, `parseDurationToMinutes`
- **`example-custom.ts`** – Brooklyn Brainery / template for custom sites
- **`eventbrite.ts`** – Eventbrite organizer pages
- **`meetup.ts`** – Meetup group events
- **`luma.ts`** – Luma calendars
- **`shopify.ts`** – Shopify stores
- **`config/sources.ts`** – List of all sources and URLs

## Adding a new scraper

1. Copy `example-custom.ts` to `your-source.ts`
2. Update `SOURCE_NAME`, `BASE_URL`, and the cheerio selectors for the target site
3. Implement `parseDateFromText` for the site’s date format
4. Add your scraper to `scripts/run-scrape-and-import.ts` in the `SCRAPERS` map
5. Run: `npm run scrape your-source`

## Running

```bash
# Platform scrapers (one scraper → multiple sources)
npm run scrape eventbrite
npm run scrape meetup
npm run scrape luma
npm run scrape shopify

# Custom example (Brooklyn Brainery)
npm run scrape example

# Clear all scraped data first, then import only this scraper's data
# (Use when you want to test one scraper without data from others)
npm run scrape luma -- --clear
```

## Platform notes

- **Eventbrite**: May block automated requests. Tries JSON-LD first, then HTML fallback.
- **Meetup**: Only fetches events from the group's own list (filters out "similar events").
- **Luma**: Parses event cards, prices, "Sold Out", "Suggested: $X".
- **Shopify**: Fetches products; workshops may be products.

## Best practices

- Use `fetchWithDelay` from utils (1–2s between requests)
- Set `externalId` when the source has stable IDs (for future deduplication)
- Handle missing fields (price, duration) with sensible defaults
- Log errors per source so one failure doesn’t stop others
