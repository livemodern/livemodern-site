import Link from "next/link";
import Img from "@/components/Img";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import HubFilter from "@/components/HubFilter";
import {
  getBySlug,
  getBuildings,
  type LifestyleHub,
  type Community,
} from "@/lib/communities";
import { listingsByLifestyle } from "@/lib/listings";
import LifestyleListings from "@/components/LifestyleListings";

/**
 * A lifestyle hub (/boating, /waterfront, ...). The UI surface for one
 * lifestyle: a curated intro, a county filter across the buildings carrying
 * this lifestyle tag, and links down to the area "spoke" collections that
 * carry the SEO.
 */
export default async function LifestyleHubPage({ hub }: { hub: LifestyleHub }) {
  const spokes = hub.spokes.map(getBySlug).filter(Boolean) as Community[];
  const liveListings = await listingsByLifestyle(hub.theme, 90);

  // Buildings tagged with this lifestyle → the live, filterable inventory.
  const tagged = getBuildings()
    .filter((b) => (b.lifestyles ?? []).includes(hub.theme))
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      city: b.city ?? "",
      county: b.county ?? "",
      hero: b.hero,
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${hub.theme} — South Florida`,
    description: hub.blurb,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Masthead active="collections" loginBand />

      {/* crumb */}
      <div className="wrap">
        <p className="crumb">
          <Link href="/collections">Collections</Link>
          <span className="sl">/</span>
          <span>{hub.theme}</span>
        </p>
      </div>

      {/* header */}
      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 20 }}>
          <p className="eyebrow">Lifestyle</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 14 }}>
            {hub.theme}
          </h1>
          <p style={{ marginTop: 14, maxWidth: "56ch", color: "var(--muted)", fontSize: 15 }}>
            {hub.blurb}
          </p>
        </section>
      </div>

      {/* SPOKES — the area collections (SEO children) */}
      {spokes.length ? (
        <div className="wrap">
          <section className="sec" style={{ paddingTop: 0, paddingBottom: 40 }}>
            <div className="sec-head">
              <div>
                <p className="eyebrow">By area</p>
                <h2 className="serif" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                  Explore by market.
                </h2>
              </div>
            </div>
            <div className="col-rail">
              {spokes.map((c) => (
                <Link className="tile" key={c.slug} href={`/${c.slug}`}>
                  <Img
                    src={c.hero}
                    alt={c.name.replace(" // LiveModern", "")}
                    fill
                    sizes="(max-width:640px) 100vw, 33vw"
                  />
                  <div className="tile-in">
                    <p className="caps">{c.county ?? "South Florida"}</p>
                    <h3>{c.name.replace(" // LiveModern", "")}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {/* TAGGED TOWERS — live, county-filterable */}
      {tagged.length ? (
        <div className="band">
          <div className="wrap">
            <section className="sec">
              <div className="sec-head">
                <div>
                  <p className="eyebrow">In the index &middot; {tagged.length} towers</p>
                  <h2 className="serif" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                    New construction, {hub.theme.toLowerCase()}.
                  </h2>
                </div>
              </div>
              <HubFilter buildings={tagged} />
            </section>
          </div>
        </div>
      ) : null}

      {/* LIVE TAGGED LISTINGS — data-first lifestyle inventory */}
      {liveListings.length ? (
        <div className="wrap">
          <section className="sec">
            <div className="sec-head">
              <div>
                <p className="eyebrow">On the market &middot; {liveListings.length}</p>
                <h2 className="serif" style={{ fontSize: "clamp(22px,3vw,32px)" }}>
                  {hub.theme} listings.
                </h2>
              </div>
            </div>
            <LifestyleListings listings={liveListings} />
          </section>
        </div>
      ) : null}

      <LeadBand
        eyebrow="Speak with us"
        heading={`Looking for ${hub.theme.toLowerCase()}?`}
        copy="Tell us the market and the must-haves — dock, floor, view, delivery — and we'll send the shortlist, then walk it with you over video or in person."
      />
      <Footer />
    </>
  );
}
