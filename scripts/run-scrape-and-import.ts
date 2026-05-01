/**
 * Run a scraper and import results to Firebase.
 * Usage: npx tsx scripts/run-scrape-and-import.ts [scraper-name] [--clear]
 *
 * --clear  Clear all scraped data (Source, ClassTemplate, ClassSession, StudioInstructor)
 *          before importing. Use this to get only the current scraper's data.
 *
 * Example: npm run scrape luma -- --clear
 */

import { db } from "../lib/firebase"
import { collection, getDocs, writeBatch } from "firebase/firestore"
import { importToFirebase } from "./importers/import-to-firebase"
import { scrapeShopify } from "./scrapers/shopify"
import { scrapeBrooklynBrainery } from "./scrapers/brainery"
import { scrapeResoBox } from "./scrapers/resobox"
import { scrapeUrbanGlass } from "./scrapers/urbanglass"
import { scrapeArtsClub } from "./scrapers/artsclub"
import { scrapeCraftSociety } from "./scrapers/craft-society"
import { scrapeFareHarbor } from "./scrapers/fareharbor"
import type { ScrapedClass } from "../types/scraped"

const SCRAPERS: Record<string, () => Promise<ScrapedClass[]>> = {
  shopify: scrapeShopify,
  brainery: scrapeBrooklynBrainery,
  resobox: scrapeResoBox,
  urbanglass: scrapeUrbanGlass,
  artsclub: scrapeArtsClub,
  "craft-society": scrapeCraftSociety,
  fareharbor: scrapeFareHarbor,
}

/** Run all enabled scrapers and combine results */
async function scrapeAll(): Promise<ScrapedClass[]> {
  const all: ScrapedClass[] = []
  for (const [name, scrape] of Object.entries(SCRAPERS)) {
    console.log(`\nRunning scraper: ${name}`)
    try {
      const results = await scrape()
      all.push(...results)
    } catch (err) {
      console.error(`  ✗ ${name} failed: ${String(err)}`)
    }
  }
  return all
}

async function clearScrapedData() {
  // Do NOT clear Source — those docs hold Places API data seeded separately
  const collections = ["ClassSession", "ClassTemplate", "StudioInstructor"]
  for (const name of collections) {
    const snap = await getDocs(collection(db, name))
    const batchSize = 500
    for (let i = 0; i < snap.docs.length; i += batchSize) {
      const batch = writeBatch(db)
      snap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    console.log(`Cleared ${name}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const clearFirst = args.includes("--clear")
  const name = args.find((a) => a !== "--clear") || "example"

  if (clearFirst) {
    console.log("Clearing existing session/template data...")
    await clearScrapedData()
  }

  let classes: ScrapedClass[]
  if (name === "all") {
    classes = await scrapeAll()
  } else {
    const scrape = SCRAPERS[name]
    if (!scrape) {
      console.error(`Unknown scraper: ${name}`)
      console.error(`Available: all, ${Object.keys(SCRAPERS).join(", ")}`)
      process.exit(1)
    }
    console.log(`Running scraper: ${name}...`)
    classes = await scrape()
  }
  console.log(`\nTotal scraped: ${classes.length} sessions`)

  if (classes.length === 0) {
    console.log("No classes to import.")
    return
  }

  console.log("Importing to Firebase...")
  const { imported, errors } = await importToFirebase(classes)
  console.log(`✅ Imported ${imported} sessions`)
  if (errors.length > 0) {
    console.error("Errors:", errors)
  }
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
