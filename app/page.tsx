import Link from "next/link";
import Img from "@/components/Img";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import IndexRow from "@/components/IndexRow";
import {
  getBuildings,
  getBySlug,
  countyCounts,
  lifestyleCounts,
  cf,
  type Community,
} from "@/lib/communities";

export const revalidate = 3600;

/** Curated lead of the index — the towers we want first-seen. */
const FEATURED = [
  "mr-c-residences",
  "olara-west-palm-beach",
  "aria-reserve-miami",
  "alba-palm-beach",
  "five-park-residences-miami-beach",
  "st-regis-sunny-isles-beach",
  "baccarat-brickell",
  "south-flagler-house-west-palm-beach",
];

/** Lifestyle rail — the curation lens. Links into the hub index, filtered. */
const LIFESTYLE_RAIL: { tag: string; blurb: string }[] = [
  { tag: "Oceanfront & Beach", blurb: "Directly on the sand" },
  { tag: "Intracoastal & Waterfront", blurb: "Bay, river, and canal" },
  { tag: "Branded Residences", blurb: "Ritz-Carlton to Bentley" },
  { tag: "Boating & Deepwater", blurb: "Slips and ocean access" },
  { tag: "Golf & Country Club", blurb: "Club living" },
  { tag: "Downtown & High-Rise", blurb: "Skyline addresses" },
];

const COLLECTIONS = [
  { slug: "modern-waterfront-homes-south-florida", kicker: "Palm Beach · Fort Lauderdale · Miami", title: "Waterfront Homes", wide: true },
  { slug: "fort-lauderdale-waterfront-homes", kicker: "Deep water · Ocean access", title: "Boating Homes" },
  { slug: "palm-beach-golf-course-homes", kicker: "Club communities", title: "Golf Homes" },
  { slug: "palm-beach-equestrian-homes", kicker: "Wellington", title: "Equestrian" },
  { slug: "new-construction-homes-south-florida", kicker: "Newly built · Never lived in", title: "New Construction Homes" },
];

const MARKET_COPY: Record<string, string> = {
  "Palm Beach": "Flagler waterfront, Worth Avenue, and the towers rewriting downtown West Palm.",
  Broward: "Las Olas, the beach, and Fort Lauderdale's yacht-forward new towers.",
  "Miami-Dade": "Brickell, Edgewater, Sunny Isles, the Grove, and the branded-residence boom.",
};

/** A lifestyle tag routes to its county-agnostic view. We send to the largest
 *  hub (Miami) pre-filtered; the chip state is read from the query param. */
function lifestyleHref(tag: string) {
  return `/new-construction?lifestyle=${encodeURIComponent(tag)}`;
}

export default function Home() {
  const buildings = getBuildings();
  const cover = getBySlug("mr-c-residences") ?? buildings.find((b) => b.hero);
  const featured = FEATURED.map(getBySlug).filter(Boolean) as Community[];
  const counts = countyCounts();
  const lifeCounts = lifestyleCounts();

  return (
    <>
      <Masthead />

      {/* ─────────────────────── COVER ─────────────────────── */}
      <section>
        <div className="cover-img">
          {cover ? (
            <Img src={cover.hero} alt={cover.name} fill priority sizes="100vw" />
          ) : null}
          <div className="cover-txt">
            <div className="wrap">
              <h1 className="serif">
                See it before
                <br />
                it&rsquo;s <em>built</em>.
              </h1>
              <p className="dek">
                South Florida&rsquo;s pre-construction towers, toured privately with the developer &mdash;
                wherever you are.
              </p>
              <div className="cover-cta">
                <a className="btn btn-solid" href="#inquire">
                  Tour live with the developer
                </a>
                <Link className="cover-link" href="/new-construction">
                  Browse the index &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <p className="caption">
            <span>
              <em>{cover?.name ?? "Mr. C Residences"}</em> &mdash; South Bayshore Drive, Coconut
              Grove. Twenty-one stories over Biscayne Bay.
            </span>
            <span>Fig. 1</span>
          </p>
        </div>
      </section>

      {/* ─────────────────── THE VIRTUAL VIEWING ─────────────────── */}
      <div className="wrap">
        <section className="sec how">
          <div className="sec-head">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="serif">
                A private preview,
                <br />
                from anywhere.
              </h2>
            </div>
          </div>
          <div className="how-grid">
            <div className="how-step">
              <span className="how-n serif">01</span>
              <h3 className="serif">Tell us the life you&rsquo;re after</h3>
              <p>
                Beachfront or boating, downtown or club living, a branded tower or something
                quieter. We curate the shortlist &mdash; only what&rsquo;s worth your time.
              </p>
            </div>
            <div className="how-step">
              <span className="how-n serif">02</span>
              <h3 className="serif">Meet the developer, live</h3>
              <p>
                We put you in a private video presentation with the development team &mdash;
                floor plans, pricing, incentives, and the allocation that&rsquo;s still open.
              </p>
            </div>
            <div className="how-step">
              <span className="how-n serif">03</span>
              <h3 className="serif">Secure your place</h3>
              <p>
                Register with the developer through us and lock your position &mdash; then visit
                the showroom in season to finish it in person.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ─────────────────────── THE INDEX ─────────────────────── */}
      <div className="band">
        <div className="wrap">
          <section className="sec">
            <div className="sec-head">
              <div>
                <p className="eyebrow">The Index &middot; {buildings.length} towers</p>
                <h2 className="serif">
                  Now rising,
                  <br />
                  building by building.
                </h2>
              </div>
              <Link className="link" href="/new-construction">
                All {buildings.length} towers &nbsp;&rarr;
              </Link>
            </div>
            <div style={{ marginTop: 8 }}>
              {featured.map((c) => (
                <IndexRow key={c.slug} c={c} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ─────────────────── BY LIFESTYLE ─────────────────── */}
      <div className="wrap">
        <section className="sec">
          <div className="sec-head">
            <div>
              <p className="eyebrow">Curated by lifestyle</p>
              <h2 className="serif">
                Start with how
                <br />
                you want to live.
              </h2>
            </div>
            <Link className="link" href="/new-construction">
              Explore all &nbsp;&rarr;
            </Link>
          </div>
          <div className="life-rail">
            {LIFESTYLE_RAIL.map(({ tag, blurb }) => {
              const n = lifeCounts[tag] ?? 0;
              if (!n) return null;
              // representative hero: first building carrying the tag
              const rep = buildings.find((b) => (b.lifestyles ?? []).includes(tag));
              return (
                <Link key={tag} className="life-card" href={lifestyleHref(tag)}>
                  {rep ? (
                    <span className="life-im">
                      <img src={cf(rep.hero, 560)} alt="" loading="lazy" />
                    </span>
                  ) : null}
                  <span className="life-bd">
                    <span className="life-n serif">{tag}</span>
                    <span className="life-meta">
                      {blurb} &middot; {n} tower{n === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* ─────────────────── MODERN HOMES ─────────────────── */}
      <div className="band">
        <div className="wrap">
          <section className="sec">
            <div className="sec-head">
              <div>
                <p className="eyebrow">Modern Homes</p>
                <h2 className="serif">
                  Not every modern
                  <br />
                  life is vertical.
                </h2>
              </div>
              <Link className="link" href="/collections">
                All collections &nbsp;&rarr;
              </Link>
            </div>
            <div className="rail">
              {COLLECTIONS.map((t) => {
                const c = getBySlug(t.slug);
                if (!c) return null;
                return (
                  <Link
                    key={t.slug}
                    className={`tile${t.wide ? " tile--wide" : ""}`}
                    href={`/${t.slug}`}
                  >
                    <Img
                      src={c.hero}
                      alt={t.title}
                      fill
                      sizes="(max-width:640px) 100vw, (max-width:1040px) 50vw, 33vw"
                    />
                    <div className="tile-in">
                      <p className="caps">{t.kicker}</p>
                      <h3>{t.title}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* ─────────────────────── MARKETS ─────────────────────── */}
      <div className="wrap">
        <section className="sec">
          <div className="sec-head" style={{ borderBottom: 0, paddingBottom: 0 }}>
            <div>
              <p className="eyebrow">Markets</p>
            </div>
          </div>
          <div className="markets">
            {(["Palm Beach", "Broward", "Miami-Dade"] as const).map((county) => (
              <div className="market" key={county}>
                <p className="caps">{county === "Palm Beach" ? "Palm Beach County" : county}</p>
                <div className="num serif">{counts[county] ?? 0}</div>
                <p>{MARKET_COPY[county]}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading="Buying pre-construction is a different transaction."
        copy="Developer contracts, deposit schedules, and allocation lists don't work like resale — and the best positions go before a building ever breaks ground. We've been on the sell side of these towers since 2008, and we'll represent you through the developer, in person or over video."
      />

      <Footer />
    </>
  );
}
