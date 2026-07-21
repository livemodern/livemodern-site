/**
 * Per-lifestyle editorial content for the spoke pages: the insider "what defines
 * this here" explainer + FAQ set. Keyed by lifestyle theme. This is the voice
 * layer that turns a listings grid into a page a lifestyle buyer gets excited by.
 */

export type InsiderPoint = { term: string; body: string };
export type SpokeFaq = { q: string; a: string };

export type LifestyleContent = {
  theme: string;
  // short editorial deck shown under the section heading
  deck: string;
  // "What defines {lifestyle} here" — the insider knowledge points
  insiderHeading: string;
  insider: InsiderPoint[];
  faqs: SpokeFaq[];
};

export const LIFESTYLE_CONTENT: Record<string, LifestyleContent> = {
  "Boating & Deepwater": {
    theme: "Boating & Deepwater",
    deck: "Not all waterfront floats a boat. Deepwater is a specific thing — ocean access, no fixed bridges, and dockage that fits your draft. Here's how to read it.",
    insiderHeading: "What deepwater actually means",
    insider: [
      {
        term: "No fixed bridges",
        body: "The phrase that matters most. A fixed bridge caps your air draft — the tallest boat that fits underneath at high tide. \u201cNo fixed bridges\u201d to the inlet means a sportfish or motoryacht with towers and outriggers can reach open ocean without ducking anything. It's the single biggest value driver on a boating home.",
      },
      {
        term: "Ocean access vs. water frontage",
        body: "A canal-front lot is waterfront. It isn't necessarily boatable to the ocean. \u201cOcean access\u201d means a navigable route to an inlet — Boca, Boynton, Palm Beach, or Jupiter — without a lock or a low bridge. We verify the route, not just the water view.",
      },
      {
        term: "Dockage, draft, and beam",
        body: "The right question isn't \u201cis there a dock,\u201d it's \u201cwhat does the dock hold.\u201d Water depth at low tide (draft), slip length, beam clearance, and whether the seawall carries a lift. A 60-foot Viking needs very different infrastructure than a center console.",
      },
      {
        term: "The inlets set the map",
        body: "Palm Beach County's boating markets orient around four inlets. Jupiter and North Palm feed the Jupiter Inlet; the Intracoastal estates of Palm Beach and Manalapan run to the Palm Beach Inlet; Boca and Delray sit near the Boca and Boynton inlets. Proximity to a maintained inlet is proximity to open water.",
      },
    ],
    faqs: [
      { q: "What does \u201cno fixed bridges\u201d mean for a boating home?", a: "It means there is no fixed-height bridge between the property and the ocean inlet, so your air draft is unrestricted \u2014 tall sportfish and motoryachts can reach open water at any tide. Homes with no-fixed-bridge ocean access command a premium over otherwise-identical canal homes." },
      { q: "How do I know a home has true ocean access?", a: "Ocean access means a navigable route from the property's dock to an inlet without a lock or low fixed bridge. We confirm the actual route and any bridge clearances along it \u2014 a water view or canal frontage alone does not guarantee you can run a boat to the ocean." },
      { q: "What water depth do I need at the dock?", a: "It depends on your vessel's draft. Many Palm Beach County canals carry 4\u20136 feet at mean low water, which suits most center consoles and express boats; deeper-draft sportfish and motoryachts need dockage on the Intracoastal or a dredged basin. We check depth at low tide, not high." },
      { q: "Can I add or extend a dock or boat lift?", a: "Often, but it's governed by the municipality, the county, and sometimes the Army Corps of Engineers and DEP, plus any HOA. Seawall condition, setback from the channel, and neighbor sightlines all factor in. We flag what's permittable before you fall in love with a lot." },
      { q: "Which Palm Beach County areas are best for boaters?", a: "Jupiter and North Palm Beach for quick Jupiter Inlet access and a serious marine community; the Intracoastal estates of Palm Beach and Manalapan for deepwater and prestige; Boca Raton and Delray Beach for no-fixed-bridge canals near the Boca and Boynton inlets." },
    ],
  },
  "Waterfront": {
    theme: "Waterfront",
    deck: "Waterfront is a spectrum \u2014 oceanfront, Intracoastal, canal, river, and lake all live under one word and buy very differently. Here's how they differ.",
    insiderHeading: "The kinds of waterfront",
    insider: [
      { term: "Intracoastal vs. oceanfront", body: "Oceanfront means the Atlantic at your door \u2014 sound, sand, and unobstructed horizon, but exposure and insurance to match. Intracoastal means the protected waterway: calmer, boatable, sunset-facing on the west bank, and typically the choice for anyone who wants to be on the water rather than just near it." },
      { term: "Canal and river frontage", body: "Canals put you on navigable water at a friendlier price than the open Intracoastal, and many carry ocean access. River frontage \u2014 the Loxahatchee up in Jupiter \u2014 trades some boating for privacy, wildlife, and old-Florida character." },
      { term: "Lakefront and the point lot", body: "Lakefront reads as serene and low-wake \u2014 great for paddleboards and skiing, not ocean runs. And on any waterway, a point lot (water on two sides) is the trophy: more frontage, longer dockage, wider views." },
      { term: "Exposure, seawalls, and insurance", body: "The water that makes a home also demands diligence: seawall age and condition, elevation and flood zone, wind exposure, and the insurance picture that follows. We treat these as facts to understand, not fears \u2014 they price into every waterfront purchase." },
    ],
    faqs: [
      { q: "What's the difference between oceanfront and Intracoastal?", a: "Oceanfront homes sit directly on the Atlantic with beach access and open views but greater exposure and higher insurance. Intracoastal homes sit on the protected inland waterway \u2014 calmer water, boat-friendly, often west-facing for sunsets \u2014 and are generally the pick for active boaters." },
      { q: "Does waterfront always mean I can keep a boat?", a: "No. Oceanfront and lakefront usually don't offer practical dockage; canal, river, and Intracoastal frontage often do, subject to depth and bridge clearances. If boating matters, look specifically for ocean access and no fixed bridges." },
      { q: "What should I check on a seawall?", a: "Age, material, cap condition, and whether it's been recently inspected or permitted for repair. A failing seawall is a significant expense, so it's a core diligence item on any waterfront home \u2014 we review it before you make an offer." },
      { q: "How does flood zone affect a waterfront home?", a: "Flood zone drives elevation requirements and insurance cost, and it varies parcel by parcel. Newer or elevated construction often prices better on insurance than older slab homes at grade. We pull the specifics for any property you're serious about." },
      { q: "Is a point lot worth the premium?", a: "For many buyers, yes \u2014 water on two sides means more frontage, longer or multiple dockage, and wider views, and those lots are scarce, so they hold value well. Whether it's worth it depends on how much the water itself is the reason you're buying." },
    ],
  },
  "Beach & Oceanfront": {
    theme: "Beach & Oceanfront",
    deck: "Oceanfront is the most literal luxury in Florida \u2014 but \u201con the beach\u201d covers everything from a private-access estate to a tower with a boardwalk. The distinctions matter.",
    insiderHeading: "Reading the oceanfront",
    insider: [
      { term: "Oceanfront vs. ocean access vs. ocean view", body: "Three very different things. Oceanfront means the sand is yours or a step away. Ocean access (boating term) means you can run a boat out. Ocean view can be a high floor blocks inland. We never conflate them \u2014 and neither should a listing." },
      { term: "Private vs. deeded vs. public access", body: "The value question on a beach home is how you get to the sand. A private beach, a deeded easement shared by a few homes, or a public access point down the block are three different lifestyles and three different price tiers." },
      { term: "Direct oceanfront towers", body: "For condos, \u201cdirect oceanfront\u201d means the unit faces the Atlantic, not the Intracoastal or the city. Line and floor matter enormously \u2014 the SE corner on a high floor is a different asset than the same square footage facing north." },
      { term: "Erosion, dunes, and setback", body: "Beachfront is dynamic. Dune lines, state coastal setback lines, and renourishment history all shape what you can build and how protected the home is. Old-Florida charm and a protective dune are worth more than they look." },
    ],
    faqs: [
      { q: "What's the difference between oceanfront and ocean view?", a: "Oceanfront means the property sits directly on the beach with the Atlantic at its edge. Ocean view simply means you can see the ocean \u2014 possibly from a high floor several blocks inland. They are priced very differently, and we're precise about which one a home actually is." },
      { q: "How does beach access work on non-oceanfront homes?", a: "Access ranges from a private deeded easement shared among a handful of homes, to a neighborhood or association beach, to a nearby public access point. The type and exclusivity of access is a major value factor, so we confirm exactly what conveys with the home." },
      { q: "On an oceanfront condo, does the line and floor matter?", a: "Enormously. A direct-ocean corner on a high floor is a materially different asset than the same unit facing north or the Intracoastal. When we show oceanfront towers, we focus on exposure, line, and floor \u2014 not just bed count and square footage." },
      { q: "What should I know about erosion and coastal setback?", a: "The state's coastal construction control line and each stretch's dune and renourishment history govern what can be built and how protected a home is. A healthy dune and a home set well back from the line are genuine assets \u2014 we review the coastal facts for any beachfront property." },
      { q: "Is oceanfront insurance a dealbreaker?", a: "It's a real cost, driven by wind exposure and flood zone, but it's manageable and it prices into the market. Newer or elevated, impact-rated construction insures far better than older oceanfront homes. We help you understand the number before you commit." },
    ],
  },
  "Golf & Club": {
    theme: "Golf & Club",
    deck: "Buying in a club community means buying two things \u2014 the home and the membership. They're separate, and the membership is often the bigger decision.",
    insiderHeading: "How club membership really works",
    insider: [
      { term: "Mandatory vs. optional membership", body: "The first question at any club community: is membership required with purchase? Some communities mandate it (and its cost); others make it optional or waitlisted. This single fact changes your total cost of ownership more than the home price does." },
      { term: "Equity vs. non-equity", body: "An equity membership means you own a share of the club and typically get a portion back when you sell it; non-equity is a deposit or annual arrangement. Equity clubs behave like an asset; non-equity clubs like a fee. Which one you're buying matters." },
      { term: "The dues stack: HOA + club", body: "HOA dues and club dues are separate line items. The HOA covers the community \u2014 gates, roads, landscaping. The club covers golf, tennis, dining, and its facilities, often with tiers (full golf, sports, social) and a food-and-beverage minimum on top." },
      { term: "Initiation, capital, and the waitlist", body: "Beyond dues there's the joining fee (initiation), sometimes a capital contribution for course or clubhouse projects, and at the best clubs, a waitlist. These figures change yearly \u2014 we point you to the membership office for the current schedule rather than quote a stale number." },
    ],
    faqs: [
      { q: "Is club membership mandatory when I buy in a golf community?", a: "It depends on the community. Some require membership (and its cost) as a condition of ownership; others make it optional or subject to a waitlist. This is the first thing we confirm, because it drives your true cost of ownership more than the purchase price." },
      { q: "What's the difference between equity and non-equity membership?", a: "An equity membership is an ownership share in the club, with a portion typically refundable when you sell it; a non-equity membership is a deposit or annual arrangement with no ownership stake. Equity clubs behave more like an asset, non-equity more like a recurring fee." },
      { q: "How do HOA dues relate to club dues?", a: "They're separate. HOA dues cover the residential community \u2014 gates, roads, common landscaping \u2014 while club dues cover golf, racquets, dining, and fitness, often in tiers. You should budget for both, plus any food-and-beverage minimum." },
      { q: "What are initiation fees like, and are they refundable?", a: "Initiation (joining) fees vary widely by club and change yearly; at equity clubs a portion may be recoverable at resale, while non-equity initiations generally are not. Because the schedules move, we direct you to the club's membership office for the current figures rather than quote a number that may be out of date." },
      { q: "Which Palm Beach County clubs should I be looking at?", a: "It depends on the golf and lifestyle you want \u2014 from the well-known championship communities to the more intimate clubs. We match the community to your game, your dining and racquet priorities, and your membership budget, and we walk you through each club's current membership structure." },
    ],
  },
  "Island": {
    theme: "Island",
    deck: "An island address is scarcity you can point to on a map. Barrier islands and gated island enclaves buy on exclusivity, access, and the water that surrounds them.",
    insiderHeading: "What island living means here",
    insider: [
      { term: "Barrier island vs. named enclave", body: "Palm Beach itself is a barrier island \u2014 the whole town. Then there are the named island enclaves: gated communities built on their own islands or peninsulas. Both trade on scarcity, but the lifestyle and price ceilings differ sharply." },
      { term: "One way on, one way off", body: "Islands are defined by their bridges. The number and type of access points shape privacy, security, and commute. A single guarded causeway is a very different life than an island threaded by public roads." },
      { term: "Water on all sides", body: "Island homes are almost always waterfront by definition \u2014 which folds in every waterfront consideration (dockage, seawalls, exposure) plus the premium of being surrounded. Many island communities are boating communities too." },
      { term: "The insurance and elevation picture", body: "Island living means coastal exposure, so elevation, flood zone, and construction quality carry extra weight. The best island homes pair the address with resilient, elevated, impact-rated construction \u2014 worth confirming, not assuming." },
    ],
    faqs: [
      { q: "What counts as an \u201cisland\u201d community here?", a: "It ranges from entire barrier-island towns like Palm Beach to gated enclaves built on their own islands or peninsulas. What they share is scarcity and water on multiple sides; what differs is the lifestyle, access, and price ceiling, which we help you compare." },
      { q: "How does island access affect the lifestyle?", a: "Access defines it. A single guarded causeway delivers privacy and security but shapes your commute; an island with public roads is more open but less controlled. The number and type of bridges is a core part of what you're buying." },
      { q: "Are island homes always waterfront?", a: "Almost always \u2014 which means island purchases carry every waterfront consideration (dockage potential, seawall condition, exposure) plus the premium of being surrounded by water. Many island communities are also excellent for boaters." },
      { q: "What should I know about insurance on an island home?", a: "Island homes have real coastal exposure, so elevation, flood zone, and construction quality matter and insurance prices accordingly. Elevated, impact-rated construction insures better; we review the specifics for any island property before you commit." },
      { q: "Why do island addresses hold value so well?", a: "Because they can't be replicated \u2014 the supply is physically fixed by the island itself. That scarcity, combined with controlled access and water on all sides, is why premier island addresses tend to be resilient stores of value." },
    ],
  },
  "Estates & Land": {
    theme: "Estates & Land",
    deck: "Acreage is the rarest thing in built-out South Florida. Estate and equestrian properties buy on land, privacy, and what you're allowed to do with it.",
    insiderHeading: "What to know about land here",
    insider: [
      { term: "Acreage in a built-out market", body: "Most of coastal Palm Beach County is subdivided into lots. Genuine acreage \u2014 an acre and up \u2014 is scarce and concentrated in specific corridors: Wellington's equestrian areas, the ranches of Loxahatchee and Jupiter Farms, and a handful of legacy estate enclaves." },
      { term: "Equestrian zoning and infrastructure", body: "An equestrian estate is a working property: barns, paddocks, rings, and \u2014 crucially \u2014 bridle-path access and zoning that permits horses. Wellington's trail network and its winter equestrian season (WEF) make it a global capital; not all \u201chorse-friendly\u201d land is created equal." },
      { term: "What the zoning allows", body: "Land value follows use rights. Can you keep horses, build a guest house or barn, subdivide, run an agricultural exemption? Two similar-looking parcels can carry very different rights. We read the zoning before you plan." },
      { term: "Privacy as the product", body: "On an estate, the acreage is the amenity \u2014 buffer, gates, and distance from the neighbors. The home matters, but many estate buyers are really buying the land, the privacy, and the ability to create their own compound." },
    ],
    faqs: [
      { q: "Where is the acreage in Palm Beach County?", a: "Genuine acreage concentrates in a few corridors: Wellington's equestrian areas, the ranch parcels of Loxahatchee and Jupiter Farms, and select legacy estate enclaves. Most of the coastal county is subdivided, which is exactly why land holds its value." },
      { q: "What makes a property truly equestrian?", a: "Zoning that permits horses, plus the infrastructure \u2014 barns, paddocks, rings \u2014 and ideally bridle-path access to a trail network. Wellington is the gold standard because of its trails and its winter equestrian festival; we confirm zoning and access rather than take \u201chorse-friendly\u201d at face value." },
      { q: "Can I build a barn, guest house, or subdivide?", a: "It depends entirely on the parcel's zoning and any HOA or agricultural designations. Two similar lots can carry very different rights, so we review what a specific property allows before you plan improvements or a compound." },
      { q: "What is an agricultural exemption and does it matter?", a: "In Florida, a bona fide agricultural use (including certain equestrian operations) can qualify a property for a lower assessed value, meaningfully reducing taxes. Whether a given estate qualifies depends on its use and acreage \u2014 worth confirming with the property appraiser." },
      { q: "Is Wellington only relevant during the winter season?", a: "The Winter Equestrian Festival draws the world from January to April, but Wellington is a year-round community with permanent facilities and residents. Seasonality affects rentals and social life more than it affects the underlying value of a well-located equestrian estate." },
    ],
  },
  "Downtown & Urban": {
    theme: "Downtown & Urban",
    deck: "Downtown luxury is about walking out your door into the city \u2014 dining, culture, and the water, without the car. The building and the block are the product.",
    insiderHeading: "Reading downtown condos",
    insider: [
      { term: "Walkability is the amenity", body: "The premium on a downtown condo is what's outside it \u2014 restaurants, waterfront, and culture within a few blocks. West Palm's Clematis and Rosemary Square, Brickell and downtown Fort Lauderdale all trade on the same idea: leave the car in the garage." },
      { term: "Line, floor, and exposure", body: "In a tower, two units of identical size can be very different homes. A high-floor corner facing the Intracoastal or the ocean is a different asset than the same footage facing the city or the parking podium. We focus on line and exposure." },
      { term: "What the HOA delivers", body: "Downtown HOA fees fund the lifestyle: concierge, valet, security, pool decks, fitness, sometimes club floors. The question is what the fee actually buys and how healthy the reserves are \u2014 an amenity-rich building with thin reserves is a risk." },
      { term: "New towers vs. established buildings", body: "New construction offers current finishes, amenities, and often pre-construction pricing, but you're buying a plan and a timeline. Established buildings are known quantities \u2014 you can see the finishes, the crowd, and the reserve history. Different buys." },
    ],
    faqs: [
      { q: "What drives value in a downtown condo?", a: "Mostly what's outside the building \u2014 walkable dining, waterfront, and culture \u2014 plus the unit's line, floor, and exposure inside the tower. A high-floor water-facing residence in a walkable core is the premium; identical square footage facing the city or podium is not." },
      { q: "Why do two same-size units price so differently?", a: "Line, floor, and view. A high corner facing the Intracoastal or ocean commands far more than the same layout facing north or the garage. When we show towers, we focus on exposure and floor, not just bed and bath count." },
      { q: "What should I look for in the HOA?", a: "What the dues actually fund \u2014 concierge, valet, security, amenities \u2014 and, critically, the health of the reserves and any pending assessments. An amenity-rich building with underfunded reserves can mean special assessments down the road, so we review the financials." },
      { q: "New construction or an established building?", a: "New towers offer current finishes and amenities and sometimes pre-construction pricing, but you're buying a plan and a delivery timeline. Established buildings let you see exactly what you're getting \u2014 finishes, residents, and reserve history. We help you weigh the trade-off." },
      { q: "Which downtown markets should I consider?", a: "Downtown West Palm Beach for walkable waterfront luxury and Brightline access; Brickell and downtown Miami for a denser urban core; downtown Fort Lauderdale and Las Olas for a middle path. Each has a distinct feel and price structure, and we'll match it to how you want to live." },
    ],
  },
  "Historic": {
    theme: "Historic",
    deck: "A historic home is architecture with a paper trail. Period districts and landmark homes buy on character \u2014 and on rules about what you can change.",
    insiderHeading: "What historic status means",
    insider: [
      { term: "District vs. individually landmarked", body: "There's a difference between a home inside a historic district and a home that's individually designated. Both carry character; the individually landmarked home usually carries stricter review over exterior changes. Know which you're buying." },
      { term: "What you can and can't change", body: "In protected districts, exterior alterations \u2014 windows, rooflines, additions, even paint in some places \u2014 may require review by a historic board. Interiors are typically freer. This shapes renovation timelines and budgets, so it's a purchase-stage fact, not a surprise." },
      { term: "The trade: charm for flexibility", body: "Historic homes offer craftsmanship, scale, and streetscape that new construction can't buy \u2014 in exchange for more process when you renovate. For the right buyer that's a fair trade; for a gut-renovator it can be friction. We're candid about which you are." },
      { term: "Where the districts are", body: "Palm Beach County's historic character lives in specific pockets \u2014 El Cid, Old Northwood, Prospect Park, Flamingo Park and Grandview Heights in West Palm Beach, plus landmark estates in the town of Palm Beach. Each district has its own rules and its own feel." },
    ],
    faqs: [
      { q: "What's the difference between a historic district and a landmarked home?", a: "A home in a historic district sits within a protected area with design guidelines; an individually landmarked home carries its own designation, usually with stricter review over exterior changes. Both offer character, but the level of oversight differs \u2014 we confirm which applies." },
      { q: "Can I renovate a historic home?", a: "Yes, but exterior changes in protected districts \u2014 windows, additions, rooflines, sometimes paint \u2014 may require review by a historic preservation board, while interiors are generally freer. It affects renovation timelines and budgets, so we flag the rules before you buy." },
      { q: "Are there benefits to owning a historic property?", a: "Beyond the irreplaceable architecture and streetscape, some historic designations open the door to tax incentives or grants for approved preservation work. Eligibility varies by property and program, so it's worth exploring with the local preservation office." },
      { q: "Do historic districts hold their value?", a: "Established historic districts tend to be stable and desirable precisely because their character is protected and can't be diluted by incompatible new construction. That scarcity of authentic period homes supports long-term value." },
      { q: "Where are the historic neighborhoods in Palm Beach County?", a: "Chiefly in West Palm Beach \u2014 El Cid, Old Northwood, Prospect Park, Flamingo Park, and Grandview Heights \u2014 along with landmark estates in the town of Palm Beach. Each has its own architectural character and its own preservation guidelines." },
    ],
  },
};

export function contentForTheme(theme: string): LifestyleContent | undefined {
  return LIFESTYLE_CONTENT[theme];
}
