/**
 * Priority studio sources for CraftPass.
 * 20 independent NYC studios across diverse craft types.
 *
 * scrapeEnabled: true  → working scraper exists, runs in CI
 * scrapeEnabled: false → scraper not yet built (FareHarbor/Acuity need Playwright,
 *                        custom sites need individual investigation)
 */
import type { SourceConfig } from "../../types/scraped"

export const SOURCES: SourceConfig[] = [
  // ─── FAREHARBOR (Playwright calendar scraper) ──────────────────────────────
  // Wick & Pour removed: quality bar not met for platform.
  // Firestore doc AW8qjq0Ne5XlGpUid8v5 can be deleted from Firebase console.
  {
    name: "Brooklyn Glass",
    slug: "brooklyn-glass",
    url: "https://brooklynglass.com",
    bookingUrl: "https://brooklynglass.com/classes",
    type: "scraper",
    platform: "fareharbor",
    neighborhood: "Gowanus",
    address: "142 13th Street, Brooklyn, NY 11215",
    instagramHandle: "brooklynglass",
    placeSearchQuery: "Brooklyn Glass glassblowing studio 142 13th Street Brooklyn",
    scrapeEnabled: true,
    description: "Brooklyn Glass is a glassblowing studio in Gowanus offering hands-on workshops in lampworking, flameworking, and fused glass for beginners and experienced artists.",
  },
  {
    name: "Craftsman Ave",
    slug: "craftsman-ave",
    url: "https://craftsmanave.com",
    bookingUrl: "https://craftsmanave.com/events-calendar/",
    type: "scraper",
    platform: "fareharbor",
    neighborhood: "Industry City",
    address: "68 34th St Building 6, Brooklyn, NY 11232",
    instagramHandle: "craftsmanave",
    placeSearchQuery: "Craftsman Ave workshop studio Industry City Brooklyn",
    scrapeEnabled: true,
    description: "Craftsman Ave is a multi-discipline maker studio at Industry City in Brooklyn, offering workshops in woodworking, metalworking, leathercraft, and other traditional trades.",
  },

  // ─── SHOPIFY (products.json — scrape enabled) ──────────────────────────────
  // NY Cake Academy removed: baking/cake focus, out of scope for now.
  // Firestore doc 4usPamk57L7r2e6WMz5F + its ClassTemplates/ClassSessions should be cleared.
  {
    name: "Here to Sunday",
    slug: "here-to-sunday",
    url: "https://www.heretosunday.com",
    bookingUrl: "https://www.heretosunday.com/collections/workshops-classes",
    type: "scraper",
    platform: "shopify",
    neighborhood: "Park Slope",
    address: "567 Union Street, Brooklyn, NY 11215",
    instagramHandle: "heretosunday",
    placeSearchQuery: "Here to Sunday craft studio 567 Union Street Brooklyn",
    scrapeEnabled: true,
    description: "Here to Sunday is a craft studio and shop in Park Slope offering workshops in weaving, embroidery, macrame, and textile arts for adults of all skill levels.",
  },
  {
    name: "Land to Sea",
    slug: "land-to-sea",
    url: "https://landtoseanyc.com",
    bookingUrl: "https://landtoseanyc.com/collections/upcoming-events",
    type: "scraper",
    platform: "shopify",
    neighborhood: "Williamsburg",
    address: "402 Graham Avenue, Brooklyn, NY 11211",
    instagramHandle: "landtoseanyc",
    placeSearchQuery: "Land to Sea NYC 402 Graham Avenue Brooklyn",
    scrapeEnabled: true,
    description: "Land to Sea is a Brooklyn craft studio and boutique in Williamsburg offering workshops in natural dyeing, weaving, and fiber arts inspired by the natural world.",
  },

  // ─── SQUARESPACE (server-rendered event listing, Cheerio scraper) ──────────
  {
    // Events page is server-rendered Squarespace; Acuity links are in the excerpts
    // for booking but price is not on listing page (price = 0 in DB).
    name: "ArtsClub",
    slug: "artsclub",
    url: "https://www.artsclubstudios.com",
    bookingUrl: "https://www.artsclubstudios.com/east-village-events",
    type: "scraper",
    platform: "acuity",
    neighborhood: "East Village",
    address: "311 East 3rd Street, New York, NY 10009",
    instagramHandle: "artsclubnyc",
    placeSearchQuery: "ArtsClub art studio 311 East 3rd Street New York",
    scrapeEnabled: true,
    description: "ArtsClub is a community art studio in the East Village offering painting, drawing, and mixed-media classes in an inclusive environment for adults and social groups.",
  },
  {
    name: "Brooklyn Metal Works",
    slug: "brooklyn-metal-works",
    url: "https://www.bkmetalworks.com",
    bookingUrl: "https://www.bkmetalworks.com/classes",
    type: "scraper",
    platform: "acuity",
    neighborhood: "Prospect Heights",
    address: "640 Dean Street, Brooklyn, NY 11238",
    instagramHandle: "brooklynmetalworks",
    placeSearchQuery: "Brooklyn Metal Works jewelry studio 640 Dean Street Brooklyn",
    scrapeEnabled: false,
    description: "Brooklyn Metal Works is a Prospect Heights jewelry and metalsmithing studio offering hands-on classes in soldering, fabrication, stone setting, and ring-making for all experience levels.",
  },

  // ─── CUSTOM HTML SCRAPERS (scrape enabled) ─────────────────────────────────
  {
    // Wix-powered site; event content is JS-rendered — uses Playwright scraper.
    name: "Craft Society",
    slug: "craft-society",
    url: "https://www.craft-society.com",
    bookingUrl: "https://www.craft-society.com/event-list",
    type: "scraper",
    platform: "custom",
    neighborhood: "Park Slope",
    address: "569 Union Street, Brooklyn, NY 11215",
    instagramHandle: "craftsocietybk",
    placeSearchQuery: "Craft Society Brooklyn 569 Union Street",
    scrapeEnabled: true,
    description: "Craft Society is a Park Slope studio offering hands-on craft workshops and creative events in a welcoming community space.",
  },
  {
    name: "Brooklyn Brainery",
    slug: "brooklyn-brainery",
    url: "https://brooklynbrainery.com",
    bookingUrl: "https://brooklynbrainery.com/courses",
    type: "scraper",
    platform: "custom",
    neighborhood: "Prospect Heights",
    address: "190 Underhill Ave, Brooklyn, NY 11238",
    instagramHandle: "brooklynbrainery",
    placeSearchQuery: "Brooklyn Brainery classes 190 Underhill Avenue Brooklyn",
    scrapeEnabled: true,
    description: "Brooklyn Brainery is a community learning space in Prospect Heights hosting an eclectic range of adult education classes, from crafts and cooking to history and science.",
  },

  // ─── CUSTOM (scraper not yet built) ────────────────────────────────────────
  {
    name: "UrbanGlass",
    slug: "urbanglass",
    url: "https://urbanglass.org",
    bookingUrl: "https://urbanglass.org/classes",
    type: "scraper",
    platform: "custom",
    neighborhood: "Fort Greene",
    address: "647 Fulton Street, Brooklyn, NY 11217",
    instagramHandle: "urbanglass_ware",
    placeSearchQuery: "UrbanGlass 647 Fulton Street Brooklyn",
    scrapeEnabled: true,
    description: "UrbanGlass is a Fort Greene nonprofit art center dedicated to glass art, offering studio access and classes in flameworking, neon, and cast glass for beginners through advanced artists.",
  },
  {
    // Makeville: all classes are multi-day intensive courses (e.g. Mon-Thu 10am-1pm, $450-$560).
    // Does not offer individual drop-in sessions — not compatible with platform model.
    // Revisit if they add single-session workshops.
    name: "Makeville",
    slug: "makeville",
    url: "https://makeville.com",
    bookingUrl: "https://makeville.com/classes",
    type: "scraper",
    platform: "custom",
    neighborhood: "Gowanus",
    address: "119 8th St, Brooklyn, NY 11215",
    instagramHandle: "makevillestudio",
    placeSearchQuery: "Makeville woodworking studio 119 8th Street Brooklyn",
    scrapeEnabled: false,
    description: "Makeville is a Gowanus woodworking and fabrication studio offering in-depth courses in furniture-making, joinery, and hand-tool woodworking.",
  },
  {
    name: "Textile Arts Center",
    slug: "textile-arts-center",
    url: "https://textileartscenter.com",
    bookingUrl: "https://textileartscenter.com/adult-classes/class-calendar/",
    type: "scraper",
    platform: "activecampaigns",
    neighborhood: "Carroll Gardens",
    address: "505 Carroll St, Brooklyn, NY 11215",
    instagramHandle: "textileartscenter",
    placeSearchQuery: "Textile Arts Center 505 Carroll Street Brooklyn",
    scrapeEnabled: false,
    description: "The Textile Arts Center is a Carroll Gardens studio dedicated to fiber arts, offering classes in weaving, spinning, natural dyeing, and sewing for all skill levels.",
  },
  // Creatively Wild removed: mixed semester + individual class structure makes
  // scraping unreliable. Revisit if they separate their offerings.
  // Firestore doc RNji2WbTpZwzg772Y0Pt can be deleted from Firebase console.
  {
    name: "Recess Grove",
    slug: "recess-grove",
    url: "https://www.recessgrove.com",
    bookingUrl: "https://book.squareup.com/classes/ug7iad378g5yho/location/LR3E6CBQNN96A/classes",
    type: "scraper",
    platform: "square",
    neighborhood: "Williamsburg",
    address: "327 Grand Street, Brooklyn, NY 11211",
    instagramHandle: "recessgrove",
    placeSearchQuery: "Recess Grove studio 327 Grand Street Brooklyn Williamsburg",
    scrapeEnabled: false,
    description: "Recess Grove is a Williamsburg craft studio offering workshops in ceramics, terrarium building, and other hands-on creative activities in a relaxed group setting.",
  },
  {
    name: "ResoBox",
    slug: "resobox",
    url: "https://resobox.com",
    bookingUrl: "https://resobox.com/events/",
    type: "scraper",
    platform: "custom",
    neighborhood: "East Village",
    address: "91 E 3rd Street, New York, NY 10003",
    instagramHandle: "resoboxny",
    placeSearchQuery: "ResoBox Japanese arts studio 91 East 3rd Street New York",
    scrapeEnabled: true,
    description: "ResoBox is an East Village cultural center and gallery specializing in Japanese art forms, offering classes in origami, shodo calligraphy, ikebana flower arranging, and more.",
  },
  // Secret Riso Club removed: site requires clicking into individual event detail
  // pages to get dates (no listing-level dates), and site was returning 503 errors.
  // Firestore doc 8nU79RMODl7LgLQxCnax can be deleted from Firebase console.
  // Atelier Sucré removed: baking/pastry focus, out of scope for now.
  // Firestore doc NAMfHHkKrL4SOJf8fGeJ can be deleted from Firebase console.
  {
    // MakerSpace NYC: listing page is on their Wix site but each class links to Eventbrite
    // for dates/booking. Scraping would require following Eventbrite URLs — out of scope.
    name: "MakerSpace NYC",
    slug: "makerspace-nyc",
    url: "https://www.makerspace.nyc",
    bookingUrl: "https://www.makerspace.nyc/classes",
    type: "scraper",
    platform: "custom",
    neighborhood: "Sunset Park",
    address: "140 58th St Building B, Brooklyn, NY 11220",
    instagramHandle: "makerspacenyc",
    placeSearchQuery: "MakerSpace NYC 140 58th Street Brooklyn",
    scrapeEnabled: false,
    description: "MakerSpace NYC is a Sunset Park fabrication studio offering access to woodworking, metalworking, electronics, and 3D printing equipment alongside classes for members and the public.",
  },
  {
    name: "The Art Studio NY",
    slug: "the-art-studio-ny",
    url: "https://www.theartstudiony.com",
    bookingUrl: "https://www.theartstudiony.com/classes",
    type: "scraper",
    platform: "custom",
    neighborhood: "Upper West Side",
    address: "243 West 72nd St, New York, NY 10023",
    instagramHandle: "theartstudiony",
    placeSearchQuery: "The Art Studio NY 243 West 72nd Street New York",
    scrapeEnabled: false,
    description: "The Art Studio NY is an Upper West Side art school offering classes in drawing, painting, sculpture, and ceramics for adults and children at all skill levels.",
  },
  {
    name: "Brooklyn Craft Company",
    slug: "brooklyn-craft-company",
    url: "https://www.brooklyncraftcompany.com",
    bookingUrl: "https://www.brooklyncraftcompany.com/collections/all-workshops",
    type: "scraper",
    platform: "squarespace",
    neighborhood: "Greenpoint",
    address: "165 Greenpoint Avenue, Brooklyn, NY 11222",
    instagramHandle: "brooklyncraftco",
    placeSearchQuery: "Brooklyn Craft Company 165 Greenpoint Avenue Brooklyn",
    scrapeEnabled: false,
    description: "Brooklyn Craft Company is a Greenpoint craft studio offering workshops in macrame, weaving, and fiber arts in a bright, welcoming studio space.",
  },
]

/** Studios with a working scraper */
export function getScrapableSources(): SourceConfig[] {
  return SOURCES.filter((s) => s.scrapeEnabled && s.url !== null)
}

/** Studios by platform */
export function getSourcesByPlatform(platform: SourceConfig["platform"]): SourceConfig[] {
  return SOURCES.filter((s) => s.platform === platform)
}

/** All studios (for seeding Places API data) */
export function getAllSources(): SourceConfig[] {
  return SOURCES
}
