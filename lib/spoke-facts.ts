/**
 * "Fun facts" for the lifestyle-spoke sidebar — real, evergreen color per
 * lifestyle, with county overrides where a market reads differently (Miami/Broward).
 */

export type SpokeFact = { term: string; body: string };
export type SpokeFactSet = { heading: string; facts: SpokeFact[] };

const BASE: Record<string, SpokeFactSet> = {
  "Boating & Deepwater": {
    heading: "On the water",
    facts: [
      { term: "Four inlets", body: "Palm Beach County runs to four ocean inlets — Boca, Boynton, Palm Beach, and Jupiter — so ocean access is never far." },
      { term: "No-bridge premium", body: "Homes with no fixed bridges to the inlet command a premium, since tall sportfish and motoryachts can reach open water at any tide." },
      { term: "Sailfish capital", body: "Palm Beach bills itself as the “Sailfish Capital of the World” — the winter sailfish run is legendary among anglers." },
      { term: "Marine culture", body: "Jupiter and North Palm Beach anchor a serious marine community, from custom sportfish builders to the Rybovich superyacht yard in West Palm." },
    ],
  },
  "Waterfront": {
    heading: "Life on the water",
    facts: [
      { term: "The Intracoastal", body: "The Intracoastal Waterway threads the whole county — protected water, west-bank sunsets, and boatable frontage without ocean exposure." },
      { term: "Five kinds of water", body: "Oceanfront, Intracoastal, canal, river, and lake each live differently; the Loxahatchee is Florida’s first federally designated Wild & Scenic River." },
      { term: "Point-lot trophies", body: "Point lots — water on two sides — are the scarcest and most coveted waterfront, with the longest dockage and widest views." },
      { term: "Sunset side", body: "On the Intracoastal, west-facing homes catch the sunset over the water — a quiet but real value driver." },
    ],
  },
  "Beach & Oceanfront": {
    heading: "On the sand",
    facts: [
      { term: "47 miles of coast", body: "Palm Beach County has roughly 47 miles of Atlantic coastline, from Jupiter down to Boca Raton." },
      { term: "Worth Avenue", body: "The town of Palm Beach pairs oceanfront estates with Worth Avenue — one of the most storied luxury shopping streets in America." },
      { term: "Access is everything", body: "The value question on a beach home is access — private, deeded, or public — and it separates otherwise-similar homes by millions." },
      { term: "Line and floor", body: "In oceanfront towers, a direct-ocean high-floor corner is a different asset entirely from the same square footage facing inland." },
    ],
  },
  "Golf & Club": {
    heading: "On the course",
    facts: [
      { term: "Golf capital", body: "Palm Beach County calls itself the “Golf Capital of Florida,” with well over 150 courses — more than any other county in the state." },
      { term: "The PGA's home", body: "PGA National in Palm Beach Gardens hosts the PGA Tour's Cognizant Classic (the former Honda Classic) on its famed Champion course." },
      { term: "Where the pros live", body: "The county is home base for a long list of touring pros — the concentration of talent living here is unmatched." },
      { term: "Two purchases", body: "Buying in a club community means buying the home and the membership — mandatory or optional, equity or non-equity, each with its own math." },
    ],
  },
  "Island": {
    heading: "Island living",
    facts: [
      { term: "Fixed supply", body: "An island address can’t be replicated — the land is physically finite, which is exactly why these addresses hold value." },
      { term: "Palm Beach itself", body: "The town of Palm Beach is a barrier island — a 16-mile ribbon of ocean-to-Intracoastal estates reached by a handful of bridges." },
      { term: "Controlled access", body: "Bridges and causeways define island life — fewer access points mean more privacy and security." },
      { term: "Water all around", body: "Island homes are almost always waterfront, folding in dockage and views along with the exclusivity of being surrounded." },
    ],
  },
  "Estates & Land": {
    heading: "Room to roam",
    facts: [
      { term: "Winter equestrian capital", body: "Wellington hosts the Winter Equestrian Festival — the largest and longest horse show in the world — drawing riders globally from January to April." },
      { term: "Acreage is scarce", body: "In a largely built-out county, genuine acreage is the rarest luxury — concentrated in Wellington, Loxahatchee, and Jupiter Farms." },
      { term: "Bridle paths", body: "Wellington's bridle-path network lets you ride from barn to showground — a system almost nowhere else can match." },
      { term: "Zoning is value", body: "On land, the zoning is the value — what you can build, whether you can keep horses, and how much you can subdivide." },
    ],
  },
  "Downtown & Urban": {
    heading: "In the city",
    facts: [
      { term: "Walkable core", body: "Downtown West Palm Beach pairs Clematis Street and Rosemary Square with an Intracoastal waterfront — dining, culture, and water on foot." },
      { term: "Brightline", body: "West Palm Beach sits on the Brightline high-speed line — downtown to Miami or Orlando without touching I-95." },
      { term: "Line and floor", body: "In a tower, the line and floor make the home — a high water-facing corner is worlds apart from the same layout facing the city." },
      { term: "The Norton", body: "The Norton Museum of Art anchors West Palm's cultural scene, one of the finest collections in the Southeast." },
    ],
  },
  "Historic": {
    heading: "With a past",
    facts: [
      { term: "Protected districts", body: "West Palm Beach's historic districts — El Cid, Old Northwood, Prospect Park, Flamingo Park, Grandview Heights — protect their period character." },
      { term: "Mizner's legacy", body: "Architect Addison Mizner defined the county's Mediterranean Revival look in the 1920s; his influence still shapes Palm Beach and Boca." },
      { term: "Scarcity of the authentic", body: "You can't build a historic home — the supply of genuine period architecture is fixed, which supports long-term value." },
      { term: "Review, not restriction", body: "In protected districts, exterior changes go through preservation review — process for renovators, protection for the streetscape." },
    ],
  },
};

const COUNTY: Record<string, SpokeFactSet> = {
  "Boating & Deepwater||Broward": {
    heading: "On the water",
    facts: [
      { term: "Yachting capital", body: "Fort Lauderdale is the “Yachting Capital of the World,” with 300+ miles of navigable waterways and the largest boat show on earth." },
      { term: "The canals", body: "The Las Olas Isles and surrounding finger-isle canals put deepwater dockage behind the house, minutes from Port Everglades inlet." },
      { term: "Port Everglades", body: "A deep, well-maintained inlet at Port Everglades gives quick, reliable ocean access for large vessels." },
      { term: "No-bridge value", body: "As everywhere, no fixed bridges to the inlet is the premium — unrestricted air draft to open water." },
    ],
  },
  "Boating & Deepwater||Miami-Dade": {
    heading: "On the water",
    facts: [
      { term: "Biscayne Bay", body: "Miami's boating life centers on Biscayne Bay — protected water with fast access to the ocean and the islands." },
      { term: "The island enclaves", body: "Star, Palm, and Hibiscus Islands and the Venetian Islands put deepwater dockage steps from South Beach." },
      { term: "Government Cut", body: "Government Cut and Haulover Inlet give direct ocean access for everything from center consoles to megayachts." },
      { term: "Year-round cruising", body: "Miami's position opens the Keys and the Bahamas as weekend runs — a boater's launch point to the tropics." },
    ],
  },
  "Beach & Oceanfront||Miami-Dade": {
    heading: "On the sand",
    facts: [
      { term: "Miami Beach", body: "From South Beach to Bal Harbour and Sunny Isles, Miami's oceanfront is a wall of iconic beachfront towers." },
      { term: "Direct-ocean towers", body: "The premium is the direct-ocean line and high floor — unobstructed Atlantic versus a bay or city view." },
      { term: "Bal Harbour", body: "Bal Harbour pairs oceanfront living with the Shops at Bal Harbour, a global luxury-retail landmark." },
      { term: "Deco to now", body: "Miami Beach spans historic Art Deco on Ocean Drive to brand-new supertall oceanfront residences." },
    ],
  },
  "Downtown & Urban||Miami-Dade": {
    heading: "In the city",
    facts: [
      { term: "Brickell", body: "Brickell is Miami's dense, walkable financial core — high-rise living over restaurants, bars, and Brickell City Centre." },
      { term: "Design District", body: "The Miami Design District pairs luxury flagships with public art and architecture — a cultural anchor." },
      { term: "Line and floor", body: "As in any tower, the view line and floor make the home — bay-facing high floors carry the premium." },
      { term: "Art Basel", body: "Miami's global moment each December, Art Basel, cements the city's place in the international art world." },
    ],
  },
  "Downtown & Urban||Broward": {
    heading: "In the city",
    facts: [
      { term: "Las Olas", body: "Las Olas Boulevard is downtown Fort Lauderdale's walkable spine — dining and galleries steps from the New River." },
      { term: "Riverwalk", body: "The Riverwalk district blends high-rise living with waterfront paths along the New River." },
      { term: "Brightline", body: "Fort Lauderdale sits on the Brightline line — quick rail to Miami or West Palm without the drive." },
      { term: "Line and floor", body: "In the towers, the view line and floor define the residence — water-facing high floors lead." },
    ],
  },
  "Beach & Oceanfront||Broward": {
    heading: "On the sand",
    facts: [
      { term: "Fort Lauderdale Beach", body: "Broward's coast runs from Hollywood's broadwalk through Fort Lauderdale Beach to the low-rise calm of Hillsboro." },
      { term: "Galt Ocean Mile", body: "The Galt Ocean Mile is a classic wall of oceanfront towers with direct-beach living." },
      { term: "Access is everything", body: "Private, deeded, or public beach access separates otherwise-similar homes — it's the core value question." },
      { term: "Line and floor", body: "In oceanfront towers, the direct-ocean high floor is a different asset than the same unit facing inland." },
    ],
  },
  "Golf & Club||Miami-Dade": {
    heading: "On the course",
    facts: [
      { term: "Championship pedigree", body: "Miami-Dade's club communities include championship courses with real tournament history." },
      { term: "Two purchases", body: "A club home is the residence plus the membership — mandatory or optional, equity or non-equity." },
      { term: "Gated and private", body: "Miami's golf communities pair the course with gated security and full club amenities." },
      { term: "Year-round golf", body: "South Florida's climate means golf every month of the year — the courses never close." },
    ],
  },
  "Waterfront||Miami-Dade": {
    heading: "Life on the water",
    facts: [
      { term: "Biscayne Bay", body: "Miami waterfront centers on Biscayne Bay — protected water, skyline views, and quick ocean access." },
      { term: "Island living", body: "The bay's island enclaves offer waterfront with dockage minutes from the city." },
      { term: "Five kinds of water", body: "Bayfront, oceanfront, canal, and river frontage each buy differently — exposure and dockage vary widely." },
      { term: "Point-lot trophies", body: "Water on two sides means more frontage, longer dockage, and wider views — the scarcest waterfront." },
    ],
  },
  "Waterfront||Broward": {
    heading: "Life on the water",
    facts: [
      { term: "300 miles of canals", body: "Fort Lauderdale's canal network — the “Venice of America” — is one of the densest waterfront systems anywhere." },
      { term: "Behind-the-house dockage", body: "The finger isles put navigable, often deepwater dockage directly behind the home." },
      { term: "Point-lot trophies", body: "Point lots carry the longest dockage and widest views — the most coveted waterfront." },
      { term: "Ocean minutes away", body: "Port Everglades inlet gives much of the canal system fast, reliable ocean access." },
    ],
  },
};

/** county here is the full county name ("Palm Beach" | "Broward" | "Miami-Dade"). */
export function spokeFacts(theme: string, county?: string | null): SpokeFactSet | undefined {
  if (county) {
    const c = COUNTY[`${theme}||${county}`];
    if (c) return c;
  }
  return BASE[theme];
}
