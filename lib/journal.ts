/**
 * The Journal — LiveModern's editorial layer.
 *
 * Content is authored here for now (V1 wireframe); the same shape maps 1:1 to a
 * `site_posts` table when we move authoring into the CMS. Every article can
 * optionally lead with video (developer interviews) and can surface a set of
 * `featuredBuildings` (community slugs) that interlink to the building pages —
 * the internal-linking that feeds SEO and AI-recommendability.
 */

export type JournalCategory = "Building Spotlight" | "Area Guide" | "The Market";

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; caption?: string };

export type Article = {
  slug: string;
  category: JournalCategory;
  title: string;
  dek: string;
  hero: string; // R2 image URL
  /** Optional video lead — a YouTube/Vimeo id. When set, the article leads with
   *  the embed instead of the hero image (developer interviews, tours). */
  videoId?: string;
  author: string;
  date: string; // ISO
  readMinutes: number;
  featuredBuildings?: string[]; // community slugs → building-page links
  body: Block[];
  /** Featured on the index hero slot. Exactly one should be true. */
  lead?: boolean;
};

export const CATEGORIES: JournalCategory[] = ["Building Spotlight", "Area Guide", "The Market"];

export const CATEGORY_BLURB: Record<JournalCategory, string> = {
  "Building Spotlight": "Inside the towers — design, developer, and what sets each address apart.",
  "Area Guide": "How to live in each pocket of South Florida, and what's rising there.",
  "The Market": "Pre-construction intelligence, developer conversations, and where the value is.",
};

/* ────────────────────────── SEED CONTENT ──────────────────────────
   Realistic placeholders that exercise every template feature. Replace
   with real editorial as it's written; keep the shape. */

export const ARTICLES: Article[] = [
  {
    slug: "mr-c-residences-coconut-grove-first-look",
    category: "Building Spotlight",
    title: "Mr. C Residences: European Charm Over Biscayne Bay",
    dek: "The Cipriani family's first Coconut Grove address trades Miami's usual glass-and-flash for something quieter — and more assured.",
    hero: "https://images.livemodern.com/site/heroes/mr-c-residences.jpg",
    videoId: "",
    author: "Modern Living Group",
    date: "2026-07-10",
    readMinutes: 6,
    featuredBuildings: ["mr-c-residences"],
    lead: true,
    body: [
      { type: "p", text: "There is a particular kind of restraint that money can't rush. It shows up in the width of a hallway, the weight of a door, the decision to leave a view uninterrupted rather than frame it with something clever. Mr. C Residences Coconut Grove has it — and in a market that too often confuses loud with luxurious, that restraint is the entire point." },
      { type: "p", text: "Rising twenty-one stories over South Bayshore Drive, the building brings the Cipriani family's century of European hospitality to one of Miami's most residential enclaves. This is not the Grove of nightlife and neon; it is the Grove of banyan canopies, sailboats, and a village pace that Miami forgets it still has." },
      { type: "h", text: "A different kind of tower" },
      { type: "p", text: "Where much of Miami builds up and out for density, Mr. C builds in — toward service, texture, and a sense of arrival. The porte-cochère reads more grand-hotel than condo lobby. The residences favor warm materials over cold minimalism. And the amenity program is calibrated to residents who have seen the rest and want, finally, to be left alone in comfort." },
      { type: "quote", text: "The best buildings don't announce themselves. They reward the people already inside them.", cite: "On the Cipriani design philosophy" },
      { type: "p", text: "For buyers watching from out of state — which is most of them, most of the year — the move is simple: see the residences over a private walkthrough with the development team, understand the allocation that's still open, and secure a position before the building tops off. We'll handle the rest, in person when you're in town." },
    ],
  },
  {
    slug: "brickell-new-construction-guide",
    category: "Area Guide",
    title: "The Brickell New-Construction Guide",
    dek: "Miami's financial district has become a vertical city of branded towers. Here's how to read it — and which addresses are worth the wait.",
    hero: "https://images.livemodern.com/site/heroes/baccarat-brickell.jpg",
    author: "Modern Living Group",
    date: "2026-07-06",
    readMinutes: 8,
    featuredBuildings: ["baccarat-brickell", "cipriani-miami", "st-regis-brickell", "una-residences", "residences-at-1428-brickell"],
    body: [
      { type: "p", text: "A decade ago, Brickell was where you worked. Now it's where the world wants to live — a dense, walkable, water-edged district that has quietly become the most concentrated cluster of branded residences in the country. If you're buying pre-construction in Miami, odds are the shortlist runs through here. This is our field guide to the neighborhood: why it commands the premium it does, how to actually read a sales gallery, and the specific towers we're tracking for clients right now." },
      { type: "h", text: "Why Brickell, and why now" },
      { type: "p", text: "The appeal is structural, not seasonal. Brickell is a true urban core with Biscayne Bay on one side, the Miami River cutting through the middle, and a skyline that keeps rewriting itself every eighteen months. It is the rare Florida market that lives year-round — restaurants full on a Tuesday in August, not just during season. For a buyer watching from a thousand miles away, that liquidity is the whole point: a market that doesn't go dark in July holds value differently than one that empties out after Easter." },
      { type: "p", text: "Geography does the heavy lifting. Brickell Avenue runs north to south along the water, and everything worth knowing sits within a fifteen-minute walk of it — Brickell City Centre's shopping and dining, the Metromover loop that makes a car optional, the financial towers that give the district its weekday density. Unlike the barrier-island markets, you are buying into a place that functions as a city, not a resort. That distinction shows up in resale, in rentability, and in how the towers are designed: these are buildings meant to be lived in full-time, not visited." },
      { type: "p", text: "Timing matters too. The current development cycle is unusually top-heavy — a wave of hospitality-branded towers delivering between now and 2028, most still selling from the floor plan. That means the best inventory, the corner lines and the higher floors with unobstructed bay views, is available to buyers willing to commit before the building tops off. Wait until delivery and you are buying whatever the early buyers passed on." },
      { type: "h", text: "How to read a branded tower" },
      { type: "p", text: "Every serious Brickell tower now carries a name you recognize from somewhere else — a hotel group, a fashion house, a crystal maker. The branding is real and it is not nothing: it signals a level of finish, service, and resale narrative that a generically-named building can't easily claim. But the logo is the beginning of due diligence, not the end of it. What separates two branded towers a block apart is rarely the brand. It's the fundamentals underneath it." },
      { type: "quote", text: "In Brickell, the building's brand gets you in the door. The floor plan is what you actually live in.", cite: "Modern Living Group" },
      { type: "p", text: "Four things decide whether a residence is worth its price. First, the floor plate — how the units are laid out on each level, how many share an elevator bank, whether the corner lines get light on two sides. Second, ceiling height; ten-foot ceilings and floor-to-ceiling glass are the current standard, and anything less reads as a compromise at this price. Third, the depth and quality of amenities, because in a full-time building the amenity deck is an extension of your home, not a brochure photo. And fourth — the one most buyers overlook — how much allocation is left, and on which lines. A tower that's eighty percent sold is telling you something, and so is one that's still wide open a year into sales." },
      { type: "p", text: "This is where representation earns its keep. Developers release inventory in phases, adjust pricing as floors sell, and hold back the best lines for relationships. Knowing which building is quietly negotiable, which is genuinely almost gone, and which is repricing next quarter is not information you'll find on a website. It's the difference between paying the sticker and buying well." },
      { type: "h", text: "The addresses to know" },
      { type: "p", text: "The current wave leans hard into hospitality branding, and the towers below are the ones we're actively tracking for clients. Each links through to the full facts — developer, architect, delivery timeline, and what's available right now — but here's how we'd frame them." },
      { type: "p", text: "Baccarat Residences Brickell is the statement address of the group: a 75-story glass tower planted where the Miami River meets Biscayne Bay, which gives it water views from essentially every angle. The interiors lean into the Baccarat story — 18th-century French design crossed with 1930s Art Deco, handcrafted crystal throughout — for a look that's more layered and ornamental than the typical minimalist Miami tower. If you want a building with a genuine point of view, this is it." },
      { type: "p", text: "Cipriani Residences Miami is the scale play: an 80-story tower with a cascading glass silhouette and 397 residences, including penthouses with private pools. Floor plans run one to four bedrooms with ten-foot ceilings, and the chef kitchens carry Italian cabinetry and Wolf and Sub-Zero appliances. With a footprint this large, the conversation is entirely about line and floor — a high bay-facing corner here is a completely different asset than an interior unit on a low floor, even at the same square footage." },
      { type: "p", text: "St. Regis Residences Miami Brickell brings the most established hospitality name in the group, developed with Related. The East Tower rises 48 stories with 149 residences, and the floor plans go big — two to seven bedrooms, ranging from roughly 2,300 to 8,900 square feet, with sky villas at the top. This is the building for a buyer who wants a primary-residence-sized home in the sky, not a pied-à-terre, with full St. Regis service attached." },
      { type: "p", text: "Una Residences is the design-forward choice — an iconic, wave-formed tower with a smooth metallic skin, sitting directly on the water south of the Brickell core. It houses 135 residences across 47 floors, two- to five-bedroom homes from about 1,100 to 4,700 square feet, every room wrapped in floor-to-ceiling glass. The waterfront position and the sculptural architecture make it one of the most recognizable silhouettes on the bay." },
      { type: "p", text: "Residences at 1428 Brickell is the connoisseur's pick: just 189 limited-edition residences designed by ACPV Architects, with an almost unheard-of 80,000 square feet of amenities. It's positioned as the most private and livable of the group — fewer units, more space per resident, and a focus on the daily experience of living there rather than the marquee. For a buyer who values scarcity and craft over the biggest name on the door, it's the one to see." },
      { type: "h", text: "What you're actually paying for" },
      { type: "p", text: "Brickell pricing sits at the top of Miami's condo market, and the number on the sheet can look steep next to a comparable square footage in a non-branded building a few blocks inland. The premium is real, and it's worth understanding what it buys. Part of it is the land — waterfront and river-adjacent parcels in a built-out district are finite, and the towers going up now are on some of the last of them. Part of it is the brand and the service model, which carry a resale narrative that follows the building for decades. And part of it is simply the finish level: the ceiling heights, the appliance packages, the amenity square footage that a full-service tower has to deliver to justify its name." },
      { type: "p", text: "Where buyers get value wrong is treating all branded towers as interchangeable at the top of the market. They aren't. A large-floor-plate building like Cipriani prices its interior lines very differently from its bay-facing corners, and the spread between them can be enormous. A boutique building like 1428 Brickell charges for scarcity — fewer units, more amenity per resident — which is a different value proposition than a 400-unit tower selling on brand and views. Knowing which model you're buying into, and where the pricing is soft within a given building, is how you avoid overpaying for the logo and underpaying attention to the floor plan." },
      { type: "h", text: "Buying pre-construction as a remote buyer" },
      { type: "p", text: "Most of our Brickell buyers aren't in Miami when they decide. That's normal here, and the transaction is built for it — but it works differently than a resale, and the differences are worth understanding before you wire a deposit. Pre-construction runs on a developer contract, not a standard resale agreement: deposits are staged, typically released against construction milestones, and the money is committed long before you ever see the finished unit. Reservation, hard contract, and closing can span two or three years." },
      { type: "p", text: "That timeline is a feature if you use it well. Early buyers get first choice of lines and the best pricing, and they have years to arrange financing and plan the move. It's a risk if you go in blind — which is why the reservation stage, before anything is binding, is where the real work happens: comparing allocation across towers, reading the fine print on deposit schedules, and confirming the developer's track record on delivery. We handle that diligence for clients, and we do the in-person walk-throughs — sales galleries, model units, the actual view from the actual floor — so a remote buyer isn't deciding on renderings alone." },
      { type: "p", text: "The one thing we tell every out-of-town buyer: reserve early on the building you want, then use the construction window to get comfortable. The worst position in this market is falling for a tower after the good lines are gone." },
      { type: "quote", text: "The best inventory in Brickell is spoken for before the building tops off. If you're serious about a line, the move is to reserve now and refine later.", cite: "Modern Living Group" },
      { type: "p", text: "Below are the towers referenced above, each linking through to the full building profile — developer, architect, delivery, and current availability. If you're weighing two of them, or want to know which lines are still open and where there's room to negotiate, that's exactly the conversation to have with us. We'll handle the rest in person when you're in town." },
    ],
  },
  {
    slug: "developer-conversation-terra-group",
    category: "The Market",
    title: "In Conversation: Building for the Buyer Who Isn't Here Yet",
    dek: "A developer on designing pre-construction towers for a market where most buyers are watching from a thousand miles away.",
    hero: "https://images.livemodern.com/site/heroes/olara-west-palm-beach.jpg",
    videoId: "dQw4w9WgXcQ",
    author: "Modern Living Group",
    date: "2026-07-01",
    readMinutes: 5,
    featuredBuildings: ["olara-west-palm-beach", "mr-c-residences-west-palm-beach"],
    body: [
      { type: "p", text: "The economics of a pre-construction tower are a bet on a buyer who, at the moment of sale, cannot walk the floor, feel the finishes, or watch the sun move across the living room. Increasingly, that buyer isn't even in Florida. We sat down with a developer reshaping downtown West Palm Beach to talk about designing for exactly that person." },
      { type: "h", text: "The video walkthrough is the new model home" },
      { type: "p", text: "\"We used to build a sales gallery and wait for people to fly in,\" they told us. \"Now the first impression happens on a screen. So the renderings have to be honest, the walkthrough has to feel like a private tour, and the person on the other end of that call has to be able to answer every question in the moment. If they can't, you've lost the buyer.\"" },
      { type: "quote", text: "The buyer decides on the video call. The showroom just confirms what they already felt.", cite: "On the shift to remote-first sales" },
      { type: "p", text: "It's a shift that rewards a specific kind of representation — one that knows the deposit structures, the delivery timelines, and the allocation cold, and can present it as clearly over video as across a table. For the buyer, it collapses distance. For the developer, it widens the market to anyone, anywhere." },
    ],
  },
];

export function getArticles(): Article[] {
  return [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
}

export function getLead(): Article | undefined {
  return ARTICLES.find((a) => a.lead) ?? getArticles()[0];
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function relatedArticles(a: Article, n = 2): Article[] {
  return getArticles()
    .filter((x) => x.slug !== a.slug)
    .sort((x, y) => (x.category === a.category ? -1 : 0) - (y.category === a.category ? -1 : 0))
    .slice(0, n);
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
