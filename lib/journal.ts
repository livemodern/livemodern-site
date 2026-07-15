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
    readMinutes: 9,
    featuredBuildings: ["baccarat-brickell", "cipriani-miami", "st-regis-brickell", "una-residences", "residences-at-1428-brickell"],
    body: [
      { type: "p", text: "A decade ago, Brickell was where you worked. Now it's where the world wants to live — a dense, walkable, water-edged district that has quietly become the most concentrated cluster of branded residences in the country. If you're buying pre-construction in Miami, odds are the shortlist runs through here." },
      { type: "h", text: "Why Brickell, and why now" },
      { type: "p", text: "The appeal is structural: a true urban core with the bay on one side, a river through the middle, and a skyline that keeps rewriting itself. Unlike the beach markets, Brickell lives year-round — restaurants full on a Tuesday, not just in season. For remote buyers, that liquidity matters; it's a market that doesn't go dark in July." },
      { type: "h", text: "The addresses to know" },
      { type: "p", text: "The current wave leans into hospitality branding — Baccarat, Cipriani, St. Regis — each pairing a global name with a developer's execution. The differentiators aren't the logos; they're the floor plates, the ceiling heights, the amenity depth, and how much allocation is left. That's where representation earns its keep." },
      { type: "quote", text: "In Brickell, the building's brand gets you in the door. The floor plan is what you actually live in." },
      { type: "p", text: "Below are the towers we're actively tracking for clients. Each links through to the full facts — developer, architect, delivery, and what's available now." },
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
