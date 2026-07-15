import Link from "next/link";
import Img from "@/components/Img";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import { getAll, getBySlug, getRelated } from "@/lib/communities";
import {
  getBuildingInventory,
  mls,
  mlsSrcSet,
  money,
  pricePerSqft,
  fullAddress,
  type Listing,
} from "@/lib/listings";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAll().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getBySlug(slug);
  if (!c) return {};
  return {
    title: c.name,
    description: c.metaDescription || `${c.name} — new construction in ${c.city ?? "South Florida"}.`,
    openGraph: {
      title: `${c.name} | LiveModern`,
      description: c.metaDescription,
      images: c.hero ? [c.hero] : undefined,
    },
  };
}

function UnitCard({ u, rent, sold }: { u: Listing; rent?: boolean; sold?: boolean }) {
  const photo = (u.image_urls ?? [])[0];
  const price = sold ? (u.close_price ?? u.list_price) : u.list_price;
  const tag = sold ? "Sold" : rent ? `${money(u.list_price)}/mo` : u.status === "ActiveUnderContract" ? "Under Contract" : "For Sale";
  return (
    <a className="unit" href={`/listing/${u.mls_id}`}>
      <div className="unit-im">
        {photo ? (
          <img
            src={mls(photo, 600)}
            srcSet={mlsSrcSet(photo, [390, 600])}
            sizes="(max-width:640px) 100vw, 33vw"
            alt={`${u.building_name ?? ""} ${u.unit_number ?? ""}`}
            loading="lazy"
          />
        ) : null}
        <span className="unit-tag">{tag}</span>
      </div>
      <div className="unit-bd">
        <div className="unit-p serif">{sold ? money(price) : rent ? `${money(u.list_price)}/mo` : money(u.list_price)}</div>
        <div className="unit-a">
          {u.unit_number ? `Residence ${u.unit_number}` : fullAddress(u)}
        </div>
        <div className="unit-s">
          <span>{u.beds ?? "—"} Bed</span>
          <span>{u.baths ?? "—"} Bath</span>
          <span>{u.sqft ? u.sqft.toLocaleString() : "—"} SF</span>
        </div>
      </div>
    </a>
  );
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getBySlug(slug);
  if (!c) notFound();

  const inventory = c.type === "building" ? await getBuildingInventory(c.slug) : { forSale: [], forRent: [], recentSales: [], activeCount: 0 };
  const hasInventory = inventory.activeCount > 0 || inventory.recentSales.length > 0;
  const priceFrom = inventory.forSale.length
    ? Math.min(...inventory.forSale.map((u) => u.list_price ?? Infinity).filter((n) => Number.isFinite(n)))
    : null;
  const related = getRelated(c, 3);
  const gallery = c.gallery.filter((g) => g !== c.hero).slice(0, 5);
  const breakImage = gallery[0];
  const grid = gallery.slice(1, 6);
  // Standfirst: the editorial deck. Use the curated meta description when we have
  // one — never a naive sentence split (". " breaks on "Mr. C", "St. Regis", etc).
  const standfirst = (c.metaDescription || c.body[0] || "").trim();
  const isBuilding = c.type === "building";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: c.name,
    description: c.metaDescription || undefined,
    image: c.hero || undefined,
    address: c.city
      ? {
          "@type": "PostalAddress",
          addressLocality: c.city,
          addressRegion: "FL",
          addressCountry: "US",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Masthead active={isBuilding ? "nc" : "homes"} />

      <div className="wrap">
        <p className="crumb">
          {c.county ? (
            <Link href="/new-construction">{c.county}</Link>
          ) : null}
          {c.city && c.city !== c.county ? (
            <>
              {c.county ? <span className="sl">/</span> : null}
              <span>{c.city}</span>
            </>
          ) : null}
          {c.county || (c.city && c.city !== c.county) ? <span className="sl">/</span> : null}
          {c.name}
        </p>
      </div>

      <section className="cover-img">
        <Img src={c.hero} alt={c.name} fill priority sizes="100vw" />
        <div className="cover-txt">
          <div className="wrap">
            <p className="eyebrow">
              {c.city ? `${c.city} · ` : ""}
              {isBuilding ? "New Construction" : "Collection"}
            </p>
            <h1 className="serif">{c.name}</h1>
          </div>
        </div>
      </section>
      <div className="wrap">
        <p className="caption">
          <span>
            <em>{c.name}</em>
            {c.city ? ` — ${c.city}, Florida.` : "."}
          </span>
          <span>Fig. 1</span>
        </p>
      </div>

      <div className="wrap">
        <div className="stats">
          <div className="stat">
            <p className="caps">Market</p>
            <div className="v serif">{c.city ?? "South Florida"}</div>
          </div>
          <div className="stat">
            <p className="caps">County</p>
            <div className="v serif">{c.county ?? "—"}</div>
          </div>
          <div className="stat">
            <p className="caps">Status</p>
            <div className="v serif">
              {inventory.activeCount > 0 ? `${inventory.activeCount} Available` : isBuilding ? "Now Selling" : "Curated"}
            </div>
          </div>
          <div className="stat">
            <p className="caps">{priceFrom ? "Priced from" : "Pricing"}</p>
            <div className="v serif">{priceFrom ? money(priceFrom) : "On request"}</div>
          </div>
        </div>
      </div>

      <nav className="subnav">
        <div className="subnav-in">
          <a href="#story">The Story</a>
          {gallery.length ? <a href="#gallery">Gallery</a> : null}
          <a href="#availability">Availability</a>
          <a href="#recent-sales">Recent Sales</a>
          <a href="#inquire">Inquire</a>
        </div>
      </nav>

      <div className="wrap" id="story">
        <section className="feature">
          <div className="spread">
            <div>
              {standfirst ? <p className="standfirst">{standfirst}</p> : null}
              <p className="byline">
                Words by Modern Living Group
                {c.city ? ` · ${c.city}` : ""}
              </p>
              <div className="body">
                {c.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            <aside className="sheet">
              <h4>Fact Sheet</h4>
              <dl>
                <div className="f">
                  <dt>Name</dt>
                  <dd>{c.name}</dd>
                </div>
                {c.city ? (
                  <div className="f">
                    <dt>City</dt>
                    <dd>{c.city}</dd>
                  </div>
                ) : null}
                {c.county ? (
                  <div className="f">
                    <dt>County</dt>
                    <dd>{c.county}</dd>
                  </div>
                ) : null}
                <div className="f">
                  <dt>Type</dt>
                  <dd>{isBuilding ? "Condominium" : "Collection"}</dd>
                </div>
                <div className="f">
                  <dt>Status</dt>
                  <dd>{isBuilding ? "Now selling" : "Curated search"}</dd>
                </div>
                <div className="f">
                  <dt>Pricing</dt>
                  <dd>On request</dd>
                </div>
              </dl>
              <a className="btn btn-dark" href="#inquire">
                Request pricing
              </a>
            </aside>
          </div>
        </section>
      </div>

      {breakImage ? (
        <>
          <figure className="bleed">
            <Img src={breakImage} alt={c.name} sizes="100vw" widths={[640, 960, 1200, 1600, 1920]} />
          </figure>
          <div className="wrap">
            <p className="caption">
              <span>
                Inside <em>{c.name}</em>.
              </span>
              <span>Fig. 2</span>
            </p>
          </div>
        </>
      ) : null}

      {grid.length ? (
        <div className="wrap">
          <section className="sec" id="gallery">
            <div className="sec-head">
              <div>
                <p className="eyebrow">Gallery &middot; {c.gallery.length} images</p>
                <h2 className="serif">Inside the building.</h2>
              </div>
            </div>
            <div className="gal">
              {grid.map((g, i) => (
                <figure key={i}>
                  <Img
                    src={g}
                    alt={`${c.name} — image ${i + 1}`}
                    sizes="(max-width:900px) 50vw, 25vw"
                    widths={[390, 640, 800]}
                  />
                </figure>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <div className="wrap">
        <section className="sec" id="availability" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <div>
              <p className="eyebrow">Availability</p>
              <h2 className="serif">
                {inventory.activeCount > 0
                  ? `${inventory.activeCount} residence${inventory.activeCount === 1 ? "" : "s"} available.`
                  : "Residences for sale."}
              </h2>
            </div>
          </div>

          {inventory.forSale.length > 0 ? (
            <div className="unit-grid">
              {inventory.forSale.map((u) => (
                <UnitCard key={u.mls_id} u={u} />
              ))}
            </div>
          ) : null}

          {inventory.forRent.length > 0 ? (
            <>
              <div className="sec-head" style={{ marginTop: 48 }}>
                <div>
                  <p className="eyebrow">For Lease</p>
                  <h2 className="serif">Also available to rent.</h2>
                </div>
              </div>
              <div className="unit-grid">
                {inventory.forRent.map((u) => (
                  <UnitCard key={u.mls_id} u={u} rent />
                ))}
              </div>
            </>
          ) : null}

          {!hasInventory ? (
            <div className="avail">
              <div className="avail-txt">
                <p className="caps">No public listings</p>
                <h3 className="serif">Inventory here isn&rsquo;t on the MLS.</h3>
                <p>
                  Residences at {c.name} are sold through the developer&rsquo;s sales gallery, not the
                  open market. We hold the current pricing sheet, the available lines, and the deposit
                  schedule.
                </p>
                <a className="btn btn-dark" href="#inquire">
                  Request availability
                </a>
              </div>
              <div className="avail-img">
                {gallery[1] || c.hero ? (
                  <Img src={gallery[1] ?? c.hero} alt="" fill sizes="(max-width:860px) 100vw, 45vw" />
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        {inventory.recentSales.length > 0 ? (
          <section className="sec" id="recent-sales" style={{ paddingTop: 0 }}>
            <div className="sec-head">
              <div>
                <p className="eyebrow">Recent Sales</p>
                <h2 className="serif">What&rsquo;s traded here.</h2>
              </div>
            </div>
            <div className="unit-grid">
              {inventory.recentSales.map((u) => (
                <UnitCard key={u.mls_id} u={u} sold />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <LeadBand
        eyebrow={c.name}
        heading="Request pricing and floor plans."
        copy="Available lines, pricing, deposit schedule, and delivery timing — sent directly, not through a portal."
        cta="Send me availability"
        withInterest
      />

      {related.length ? (
        <div className="wrap">
          <section className="sec">
            <div className="sec-head">
              <div>
                <p className="eyebrow">Also in {c.county}</p>
                <h2 className="serif">More from the index.</h2>
              </div>
            </div>
            <div className="more">
              {related.map((r) => (
                <Link className="mcard" key={r.slug} href={`/${r.slug}`}>
                  <Img
                    src={r.hero}
                    alt={r.name}
                    sizes="(max-width:760px) 100vw, 33vw"
                    widths={[390, 640]}
                  />
                  <p className="caps">
                    {r.city} &middot; New Construction
                  </p>
                  <h3 className="serif">{r.name}</h3>
                  <p>Pricing on request</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <Footer />
    </>
  );
}
