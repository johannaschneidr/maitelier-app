/**
 * Craft taxonomy (primary crafts) — matches the Weeks 1–2 brief.
 * Slugs are public URLs (/crafts/{slug}): never rename one, add a redirect instead.
 *
 * Until the Class schema carries an explicit `craft`, `craftForClass` maps the
 * legacy free-text `ClassTemplate.category` (plus the title) onto these slugs.
 */

export const CRAFTS = [
  { slug: "ceramics", label: "Ceramics & Pottery", noun: "pottery" },
  { slug: "woodworking", label: "Woodworking", noun: "woodworking" },
  { slug: "printmaking", label: "Printmaking", noun: "printmaking" },
  { slug: "textiles", label: "Textiles & Fiber", noun: "textile" },
  { slug: "glass", label: "Glass", noun: "glass" },
  { slug: "jewelry-metal", label: "Jewelry & Metalsmithing", noun: "jewelry" },
  { slug: "paper-book", label: "Paper & Book Arts", noun: "paper and book arts" },
  { slug: "painting-drawing", label: "Painting & Drawing", noun: "painting and drawing" },
  { slug: "floral-botanical", label: "Floral & Botanical", noun: "floral" },
  { slug: "scent-candle", label: "Candles, Soap & Scent", noun: "candle and scent" },
  { slug: "leather", label: "Leathercraft", noun: "leather" },
  { slug: "mixed", label: "Mixed / Other", noun: "creative" },
] as const

export type CraftSlug = (typeof CRAFTS)[number]["slug"]
export type Craft = (typeof CRAFTS)[number]

const BY_SLUG = new Map<string, Craft>(CRAFTS.map((c) => [c.slug, c]))

export function getCraft(slug: string): Craft | undefined {
  return BY_SLUG.get(slug)
}

/** Legacy `category` values written by the scrapers → craft slug. */
const CATEGORY_TO_CRAFT: Record<string, CraftSlug> = {
  ceramics: "ceramics",
  ceramic: "ceramics",
  pottery: "ceramics",
  woodworking: "woodworking",
  printmaking: "printmaking",
  textiles: "textiles",
  textile: "textiles",
  glass: "glass",
  glassblowing: "glass",
  "glass art": "glass",
  jewelry: "jewelry-metal",
  metalsmithing: "jewelry-metal",
  painting: "painting-drawing",
  drawing: "painting-drawing",
  floral: "floral-botanical",
  "candle making": "scent-candle",
  candles: "scent-candle",
  leather: "leather",
  bookbinding: "paper-book",
}

/** Title keywords, checked when the category is generic ("workshop") or unknown. Order matters. */
const TITLE_RULES: [RegExp, CraftSlug][] = [
  [/(ceramic|pottery|clay|wheel throw|hand ?build|kintsugi|glaz)/i, "ceramics"],
  [/(glass ?blow|stained glass|fused glass|lampwork|flamework|\bglass\b)/i, "glass"],
  [/(wood|spoon carv|carpent|joinery|furniture)/i, "woodworking"],
  [/(screen ?print|riso|linocut|lino|letterpress|etching|block print|printmaking)/i, "printmaking"],
  [/(weav|embroider|knit|crochet|sew|quilt|natural dye|indigo|punch needle|macram|fiber|yarn)/i, "textiles"],
  [/(jewel|silver|ring|earring|enamel|blacksmith|metal|solder|bead)/i, "jewelry-metal"],
  [/(bookbind|marbl|papermak|calligraph)/i, "paper-book"],
  [/(paint|watercolor|gouache|acrylic|draw|sketch|illustrat|figure)/i, "painting-drawing"],
  [/(flower|floral|terrarium|ikebana|wreath|bouquet)/i, "floral-botanical"],
  [/(candle|soap|perfume|fragrance|scent)/i, "scent-candle"],
  [/(leather|wallet|bag making)/i, "leather"],
]

export function craftForClass(category: string | undefined, title: string): CraftSlug {
  const fromCategory = category ? CATEGORY_TO_CRAFT[category.trim().toLowerCase()] : undefined
  if (fromCategory) return fromCategory
  for (const [re, craft] of TITLE_RULES) if (re.test(title)) return craft
  return "mixed"
}
