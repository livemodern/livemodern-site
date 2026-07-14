import Link from "next/link";
import Image from "next/image";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import IndexRow from "@/components/IndexRow";
import { getBuildings, getBySlug, countyCounts, type Community } from "@/lib/communities";

export const revalidate = 3600;

/** Curated lead of the index — the towers we want first-seen. */
const FEATURED = [
  "mr-c-residences-coconut-grove",
  "olara-west-palm-beach",
  "aria-reserve-miami",
  "alba-palm-beach",
  "five-park-residences-miami-beach",
  "st-regis-sunny-isles-beach",
  "baccarat-brickell",
  "south-flagler-house-west-palm-beach",
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

export default function Home() {
  const buildings = getBuildings();
  const cover = getBySlug("mr-c-residences-coconut-grove");
  const featured = FEATURED.map(getBySlug).filter(Boolean) as Community[];
  const counts = countyCounts();

  return (
    <>
      <Masthead />

      <section>
        <div className="cover-img">
          {cover ? (
            <Image
              src={cover.hero}
              alt={cover.name}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          ) : null}
          <div className="cover-txt">
            <div className="wrap">
              <p className="eyebrow">Now Selling · Coconut Grove</p>
              <h1 className="serif">
                Live <em>modern</em>.
              </h1>
              <p className="dek">
                The definitive index of South Florida&rsquo;s new towers and modern homes &mdash;
                Palm Beach to Miami, one register.
              </p>
              <div className="cover-cta">
                <Link className="btn btn-solid" href="/new-construction">
                  Browse the index
                </Link>
                <a className="btn btn-ghost" href="#inquire">
                  Speak with us
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="wrap">
          <p className="caption">
            <span>
              <em>Mr. C Residences</em> &mdash; South Bayshore Drive, Coconut Grove. Twenty-one
              stories over Biscayne Bay.
            </span>
            <span>Fig. 1</span>
          </p>
        </div>
      </section>

      <div className="wrap">
        <section className="sec">
          <div className="sec-head">
            <div>
              <p className="eyebrow">The Index &middot; {buildings.length} towers</p>
              <h2 className="serif">
                New construction,
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
              <Link className="link" href="/modern-homes">
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
                    <Image
                      src={c.hero}
                      alt={t.title}
                      fill
                      sizes="(max-width:640px) 100vw, (max-width:1040px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
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
        heading="Buying new construction is a different transaction."
        copy="Developer contracts, deposit schedules, and allocation lists don't work like resale. We've been on the sell side of these towers since 2008."
      />

      <Footer />
    </>
  );
}
