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
    description: "Brooklyn Glass is a working glassblowing studio tucked into Gowanus, one of Brooklyn's most creative industrial neighborhoods. Founded by working artists, the studio offers hands-on workshops in flameworking, lampworking, and fused glass for complete beginners through experienced makers. Classes are kept small so every student gets direct attention from the instructor. Flameworking workshops teach you to work molten glass rods over a torch to create beads, ornaments, and sculptural forms; fused glass sessions let you compose layered designs that are then kiln-fired into finished pieces. No experience is required — instructors walk you through safety and technique from the first minute. The studio is a short walk from the R and F/G subway lines in a neighborhood also home to Whole Foods, the Gowanus Canal, and a growing cluster of independent galleries and food spots. Brooklyn Glass is a popular choice for date nights, birthday celebrations, and creative team outings.",
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
    description: "Craftsman Ave is a maker studio inside Industry City, the sprawling creative campus in Sunset Park that has become a hub for Brooklyn's craft and design community. Since 2015 the studio has offered four-hour hands-on workshops in woodworking, leatherworking, welding, knife making, and stained glass — all taught by experienced Brooklyn-based makers. Classes are designed for adults with no prior experience: you leave with a finished object you made yourself, not just a set of technique notes. Popular sessions include cutting board and serving board workshops, leather wallet and belt making, and forged knife classes where students shape a blade from raw steel. Groups of friends, couples, and corporate teams book out the space regularly. Industry City itself is worth the trip — surrounded by food vendors, design showrooms, and waterfront views over New York Harbor, it makes for an easy half-day outing in southern Brooklyn.",
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
    description: "Here to Sunday is a craft studio, gallery, and community shop on Union Street in Park Slope, founded by artist Diana Ho. The space carries work by over 125 local artists and creatives, and runs a rotating calendar of hands-on workshops focused on fiber arts and making. Classes cover weaving on small frame looms, embroidery and hand-stitching, macrame, natural dyeing, and seasonal craft projects. Sessions are suitable for total beginners and run on weekday evenings and weekends, making them easy to fit into a busy schedule. The shop itself is worth browsing — stocked with thoughtfully chosen art supplies, gifts, and handmade goods from Brooklyn makers. Park Slope is one of Brooklyn's most walkable neighborhoods, with Prospect Park a few blocks away and a strong concentration of independent restaurants and shops along Fifth and Seventh Avenues. Here to Sunday is a welcoming spot for solo makers, friends looking for a creative evening out, and anyone wanting to slow down and make something by hand.",
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
    description: "Land to Sea is an Asian American women-owned creative space, specialty coffee shop, and natural wine bar on Graham Avenue in East Williamsburg. The studio side of the business hosts workshops in natural dyeing, fiber arts, and weaving, drawing inspiration from traditional East Asian craft techniques and the patterns of the natural world. Classes are designed for adults of all experience levels — no background in textile work is needed. The space has a warm, neighborhood-cafe feel: you can grab a coffee or a glass of wine while you work, and the relaxed atmosphere makes workshops feel social rather than instructional. Land to Sea also hosts pop-up events and collaborations with local artists and makers. Williamsburg and East Williamsburg together form one of New York City's most vibrant creative neighborhoods, with easy subway access on the L and M lines. The studio is a standout option for anyone looking for craft classes with a distinct cultural perspective and a genuinely welcoming atmosphere.",
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
    description: "ArtsClub is a community-focused art studio on East 3rd Street in the East Village, offering a rotating calendar of painting, drawing, and mixed-media workshops for adults. Classes are designed to be inclusive and low-pressure — no artistic background is required, and instructors guide participants through each session at an accessible pace. Themed sessions have covered everything from Impressionist-style painting and portraiture to watercolor botanicals and abstract composition. The studio is a popular venue for social events: friend groups, date nights, and bachelorette parties regularly book sessions together. ArtsClub also hosts regular public events tied to art history themes and seasonal subjects. The East Village is one of Manhattan's most energetic neighborhoods, with a deep history in arts and counterculture, surrounded by independent restaurants, bars, and galleries. The studio is steps from Tompkins Square Park and well-served by the L, F, and 6 subway lines, making it easy to reach from across the city. It is a good choice for anyone wanting a sociable, structured introduction to painting in Manhattan.",
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
    description: "Brooklyn Metal Works is a 5,000 square foot professional metalsmithing and jewelry studio on Dean Street in Prospect Heights. The studio runs a full program of adult classes covering soldering, metal fabrication, stone setting, ring-making, chain construction, and forging — taught by professional jewelry artists. Introductory workshops are genuinely accessible to complete beginners and require no prior experience with tools or metals; more advanced courses take students deeper into fabrication and finishing techniques. Beyond classes, the studio offers open-studio memberships for working jewelers who need access to well-maintained equipment. Brooklyn Metal Works also runs an artist lecture series and maintains an exhibition project space, making it an active part of the broader jewelry and craft arts community in New York. Prospect Heights sits between Crown Heights and Park Slope, close to the Brooklyn Museum, Barclays Center, and Prospect Park, with good subway access on the 2, 3, B, and Q lines. It is one of the most serious and well-equipped jewelry studios in the five boroughs.",
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
    instagramHandle: "craft_soc",
    placeSearchQuery: "Craft Society Brooklyn 569 Union Street",
    scrapeEnabled: true,
    description: "Craft Society is a Park Slope studio dedicated to heritage and folk craft, offering weekly workshops and private events in a cozy, community-minded space. The class program draws on traditional textile and making techniques — lino and block printing, weaving and tapestry, embroidery, bookbinding, leather craft, natural dyeing, and seasonal fiber arts projects. Sessions are designed to be accessible to adults with no prior craft experience, and the relaxed atmosphere makes them as much a social occasion as a skills class. Craft Society also hosts private events for groups: birthdays, hen parties, team outings, and corporate workshops can all be tailored to the group's interests. The studio sits on Union Street in Park Slope, one of Brooklyn's most family-friendly and walkable neighborhoods, close to Prospect Park and well-connected by the F and G subway lines. Community evenings — low-key drop-in sessions for making and connecting with neighbors — are a regular fixture on the calendar and a good entry point for anyone new to the studio.",
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
    instagramHandle: "bkbrains",
    placeSearchQuery: "Brooklyn Brainery classes 190 Underhill Avenue Brooklyn",
    scrapeEnabled: true,
    description: "Brooklyn Brainery is a community-powered adult education space on Underhill Avenue in Prospect Heights, built on the idea that anyone with expertise can teach and anyone curious can learn. The class calendar is genuinely eclectic: alongside craft workshops in knitting, weaving, printing, and fiber arts, you will find courses on mushroom cultivation, cocktail-making, map-reading, local history, bird identification, creative writing, and dozens of other subjects. Classes are pitched at curious adults with no assumed background — the atmosphere is closer to a knowledgeable friend teaching a small group than a formal course. Most sessions run on evenings and weekends, and prices are kept accessible. Brooklyn Brainery is a particularly good option for craft beginners who want a low-stakes, sociable introduction to making without committing to a specialist studio. Prospect Heights is a lively residential neighborhood close to the Brooklyn Museum, Brooklyn Botanic Garden, and Prospect Park, served by the 2, 3, B, and Q subway lines.",
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
    instagramHandle: "urbanglass_nyc",
    placeSearchQuery: "UrbanGlass 647 Fulton Street Brooklyn",
    scrapeEnabled: true,
    description: "UrbanGlass is a nonprofit glass art center on Fulton Street in Fort Greene, one of the most respected facilities of its kind in the United States. Founded in 1977, it has supported glass artists at every stage of their practice through studio access, residencies, exhibitions, and an educational program that runs from beginner workshops to advanced techniques. Public classes cover flameworking — working molten glass over a torch to create jewelry, vessels, and sculpture — as well as neon bending, fused glass, and cast glass. The teaching staff includes working professional artists, and class sizes are kept small to allow for real technical instruction. UrbanGlass also publishes GLASS magazine, the leading publication covering the international studio glass movement. Fort Greene is one of Brooklyn's most culturally rich neighborhoods, home to the Brooklyn Academy of Music, Fort Greene Park, and a concentration of independent restaurants and shops along Fulton and DeKalb Avenues. The studio is accessible on the C, G, and B/Q subway lines, making it easy to reach from across the city.",
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
    description: "Makeville Studio is a community woodworking shop and teaching studio on 8th Street in Gowanus, operating since 2008. The studio focuses on traditional woodworking techniques taught through structured, multi-session courses: students work through furniture-making projects, hand-tool joinery, box construction, and finishing over several classes rather than a single drop-in session. This depth-first approach suits adults who want to genuinely learn the craft rather than produce a quick souvenir. The shop is well-equipped with both hand tools and stationary power tools, maintained to a high standard. Makeville also offers open-shop membership for students who have completed foundational courses and want to continue working independently. Gowanus is an up-and-coming Brooklyn neighborhood undergoing significant development, situated between Park Slope, Carroll Gardens, and Red Hook, with the F and G subway lines nearby. It has attracted a cluster of artists, makers, and small manufacturers. Makeville is an ideal fit for adults serious about learning woodworking properly in a craft-focused, non-commercial environment.",
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
    description: "The Textile Arts Center is a Carroll Gardens studio entirely dedicated to fiber arts, running one of the most comprehensive textile education programs in New York City. Adult classes cover weaving on floor and frame looms, rigid heddle weaving, hand spinning on drop spindles and spinning wheels, natural dyeing with plant-based dyes, sewing and garment construction, and embroidery. Classes are offered at beginner, intermediate, and advanced levels, so students can start from zero and continue developing their practice over time. The studio also runs youth programs, a resident artist program, and an annual Give Back Market that supports the broader fiber arts community. Carroll Gardens is a residential neighborhood in western Brooklyn known for its brownstone blocks and Italian-American roots, sitting between Cobble Hill and Red Hook with easy access on the F and G lines. The Textile Arts Center draws students from across the five boroughs and is a genuine institution for anyone serious about learning fiber arts in New York City.",
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
    description: "Recess Grove is a creative space, woodshop, café, and bar on Grand Street in Williamsburg — designed as a place to slow down, make things, and meet people. The studio side offers walk-in open sessions where you can work with ceramics, drawing materials, painting supplies, collage, polymer clay, fiber arts, and beaded jewelry for up to three hours, with all supplies included. Structured workshops and social events run alongside open studio time, and the space can be reserved for private groups. The attached café serves coffee and food; the bar serves natural wine and beer, making Recess Grove as much a neighborhood hangout as a craft studio. Classes and walk-in sessions are designed to be approachable for adults with no craft experience — the emphasis is on enjoyment and experimentation rather than producing technically perfect work. Williamsburg is Brooklyn's most internationally recognised creative neighborhood, well-connected on the L, J, M, and Z subway lines and surrounded by restaurants, galleries, and independent shops. Recess Grove is particularly well-suited to spontaneous, social, low-stakes making.",
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
    instagramHandle: "resobox",
    placeSearchQuery: "ResoBox Japanese arts studio 91 East 3rd Street New York",
    scrapeEnabled: true,
    description: "ResoBox is a Japanese cultural center, gallery, and event space on East 3rd Street in the East Village, dedicated to bringing traditional and contemporary Japanese art forms to New York City. The class program covers a wide range of disciplines: origami paper folding, shodo brush calligraphy, ikebana flower arranging, sumi-e ink painting, nerikiri wagashi confectionery, tea ceremony, and suminagashi paper marbling. Classes are led by instructors with deep expertise in their respective traditions — many are working artists or specialists who collaborate directly with Japanese artisans, local governments, and cultural organisations. Sessions are designed for English-speaking adults with no prior experience of Japanese arts, and the teaching approach emphasizes cultural context alongside technique. ResoBox also runs an ongoing gallery program and pop-up events featuring Japanese makers and designers. The East Village has a long history as a center for Asian-American communities and culture in Manhattan, and is well-served by the L, F, and 6 subway lines. ResoBox offers something genuinely distinctive: a structured introduction to Japanese craft traditions taught by people who practice them.",
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
    description: "MakerSpace NYC is a nonprofit community fabrication studio with locations in Sunset Park, Brooklyn and Staten Island, providing access to tools, equipment, and skills-based classes for makers, artists, and builders of all backgrounds. The Brooklyn location is a large shared workshop with woodworking machinery, metalworking equipment, laser cutters, 3D printers, electronics workbenches, and more. Public classes cover woodworking fundamentals, metalworking, electronics and Arduino, 3D printing, and fabrication techniques — taught in a hands-on format suited to adults with no prior technical experience. Membership gives access to open-shop hours and the full equipment inventory. MakerSpace NYC is committed to making fabrication tools and education accessible to communities that wouldn't otherwise have them, and runs outreach programs alongside its public class calendar. Sunset Park is a large, diverse Brooklyn neighborhood with a strong industrial and manufacturing history, situated along the waterfront in southern Brooklyn with views of New York Harbor and convenient access to Industry City. It is served by the N, R, and D subway lines.",
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
    description: "The Art Studio NY is an art school on West 72nd Street in the Upper West Side, consistently rated among New York City's top-rated art schools for adults. The program covers drawing from observation, oil and acrylic painting, watercolor, portraiture, figure drawing, sculpture, and ceramics — taught in small classes by professional working artists. Adult courses run at multiple skill levels, from absolute beginners picking up a pencil for the first time to experienced painters developing a more sophisticated practice. The teaching philosophy emphasizes direct observation, technical fundamentals, and individual artistic development rather than trend-driven projects. Children's and teen programs also run alongside the adult calendar. The Upper West Side is one of Manhattan's most established residential neighborhoods, stretching along the west side of Central Park between Columbus Circle and the George Washington Bridge. The studio is steps from the 72nd Street stop on the 1, 2, and 3 lines, making it convenient for students from across Manhattan and the outer boroughs. It is a strong choice for anyone looking for serious, structured art instruction in a supportive environment.",
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
    instagramHandle: "brooklyncraftcompany",
    placeSearchQuery: "Brooklyn Craft Company 165 Greenpoint Avenue Brooklyn",
    scrapeEnabled: false,
    description: "Brooklyn Craft Company is a modern craft store and DIY workshop studio on Greenpoint Avenue in Greenpoint, Brooklyn. The shop carries a carefully chosen selection of yarn, fabric, fiber craft supplies, notions, and handmade goods from local makers — and attached to it is a full workshop program covering macrame, weaving, sewing and garment-making, embroidery, knitting, quilting, and other fiber and textile arts. Classes are designed for adults at all experience levels, with a particularly welcoming approach to complete beginners. Weeknight and weekend sessions make the schedule easy to fit around work. Brooklyn Craft Company recently expanded with the BCC Annex, a second location at 37 Greenpoint Avenue, giving more space for classes and community events. Greenpoint is a north Brooklyn neighborhood with strong Polish-American roots and a growing creative and design community, adjacent to Williamsburg and well-connected by the G subway line and the East River Ferry. The studio is a standout destination for anyone interested in fiber arts in a shop environment that takes both the making and the materials seriously.",
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
