import Link from "next/link";
import Img from "@/components/Img";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import ReadMore from "@/components/ReadMore";
import SubNav from "@/components/SubNav";
import Floorplans from "@/components/Floorplans";
import Gallery from "@/components/Gallery";
import { getAll, getBuildings, getBySlug, getRelated, hubBySlug, hubForCounty, areaAnchor, CITY_HUBS, statusPill, stageLabel, collectionCounty, countyShort, collectionSiblings, hubForSpoke, LIFESTYLE_HUBS, hubBySlugLife, cf } from "@/lib/communities";
import CityIndex from "@/components/CityIndex";
import LifestyleHubPage from "@/components/LifestyleHubPage";
import LifestyleListings from "@/components/LifestyleListings";
import SpokeEnrichment from "@/components/SpokeEnrichment";
import { contentForTheme } from "@/lib/spoke-content";
import UnitGrid from "@/components/UnitGrid";
import {
  getBuildingInventory,
  getFloorplans,
  isPending,
  kindFromSlug,
  lifestyleStats,
  listingsByLifestyle,
  mls,
  mlsSrcSet,
  money,
  pricePerSqft,
  fullAddress,
  type Listing,
} from "@/lib/listings";

export const revalidate = 3600;

export function generateStaticParams() {
  return [
    ...getAll().map((c) => ({ slug: c.slug })),
    ...LIFESTYLE_HUBS.map((h) => ({ slug: h.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lh = hubBySlugLife(slug);
  if (lh)
    return {
      title: `${lh.theme} — South Florida New Construction | LiveModern`,
      description: lh.blurb,
    };
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

function UnitCard({ u, rent, sold, fallback }: { u: Listing; rent?: boolean; sold?: boolean; fallback?: string }) {
  const photo = (u.image_urls ?? [])[0];
  const price = sold ? (u.close_price ?? u.list_price) : u.list_price;
  const pending = u.status === "ActiveUnderContract" || u.status === "Pending";
  const tag = sold
    ? "Sold"
    : rent
      ? `${money(u.list_price)}/mo`
      : pending
        ? "Under Contract"
        : "For Sale";
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
        ) : fallback ? (
          <img
            className="unit-im-fallback"
            src={cf(fallback, 600)}
            sizes="(max-width:640px) 100vw, 33vw"
            alt={u.building_name ?? ""}
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
  const lifeHub = hubBySlugLife(slug);
  if (lifeHub) return <LifestyleHubPage hub={lifeHub} />;
  const c = getBySlug(slug);
  if (!c) notFound();

  const inventory = c.type === "building" ? await getBuildingInventory(c.slug) : { forSale: [], forRent: [], recentSales: [], activeCount: 0, pendingCount: 0 };
  const hasInventory = inventory.activeCount > 0 || inventory.recentSales.length > 0;
  const availableSale = inventory.forSale.filter((u) => !isPending(u));
  const priceFrom = availableSale.length
    ? Math.min(...availableSale.map((u) => u.list_price ?? Infinity).filter((n) => Number.isFinite(n)))
    : null;
  const floorplans = c.type === "building" ? await getFloorplans(c.slug) : [];
  const related = getRelated(c, 3);
  const hub = hubBySlug(c.slug);
  const hubBuildings = hub
    ? getBuildings()
        .filter((b) => b.county === hub.county)
        .map((b) => ({ slug: b.slug, name: b.name, city: b.city, hero: b.hero, lifestyles: b.lifestyles }))
    : [];
  const hubCollections = hub
    ? getAll().filter(
        (x) =>
          x.type === "collection" &&
          x.slug !== c.slug &&
          !CITY_HUBS.some((h) => h.slug === x.slug) &&
          (x.county === hub.county || (x.name.toLowerCase().includes(hub.label.toLowerCase()))),
      )
    : [];
  // Pair each gallery image with its baked native width so we never stretch a
  // small image to full-bleed (the blur bug). Break image = FIRST gallery image
  // >=1400px wide (curation order preserved); if none, the bleed is skipped.
  const galleryPairs = c.gallery
    .map((g, i) => ({ g, w: c.galleryW?.[i] ?? 0 }))
    .filter((p) => p.g !== c.hero);
  const gallery = galleryPairs.map((p) => p.g);
  const breakImage = galleryPairs.find((p) => p.w >= 1400)?.g;
  const displayName = c.name.replace(/ \/\/ LiveModern$/, "");
  // Standfirst: the editorial deck. Use the curated meta description when we have
  // one — never a naive sentence split (". " breaks on "Mr. C", "St. Regis", etc).
  const standfirst = (c.metaDescription || c.body[0] || "").trim();
  const isBuilding = c.type === "building";
  const sib = !isBuilding && !hub ? collectionSiblings(c.slug) : null;
  const sibItems = sib ? (sib.siblings.map(getBySlug).filter(Boolean) as typeof related) : [];
  // Spoke pages (a lifestyle collection like palm-beach-boating-homes) surface
  // the live tagged inventory for that lifestyle, filtered to the page's county.
  const spokeHub = !isBuilding && !hub ? hubForSpoke(c.slug) : undefined;
  const spokeCountyShort = spokeHub ? collectionCounty(c.slug) : null;
  const spokeCountyFull =
    spokeCountyShort === "Dade" ? "Miami-Dade" : spokeCountyShort ?? undefined;
  const spokeKind = kindFromSlug(c.slug);
  const spokeListings = spokeHub
    ? await listingsByLifestyle(spokeHub.theme, 90, spokeCountyFull, spokeKind)
    : [];
  const spokeStats = spokeHub
    ? await lifestyleStats(spokeHub.theme, spokeCountyFull, spokeKind)
    : null;
  const spokeContent = spokeHub ? contentForTheme(spokeHub.theme) : undefined;

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
      <Masthead active={isBuilding ? "nc" : "collections"} loginBand />

      <div className="wrap">
        <p className="crumb">
          {c.county ? (
            hubForCounty(c.county) ? (
              <Link href={`/${hubForCounty(c.county)!.slug}`}>{c.county}</Link>
            ) : (
              <Link href="/new-construction">{c.county}</Link>
            )
          ) : null}
          {c.city && c.city !== c.county ? (
            <>
              {c.county ? <span className="sl">/</span> : null}
              {hubForCounty(c.county) ? (
                <Link href={`/${hubForCounty(c.county)!.slug}#area-${areaAnchor(c.city)}`}>{c.city}</Link>
              ) : (
                <span>{c.city}</span>
              )}
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
              {isBuilding ? statusPill(c.facts) : "Collection"}
            </p>
            <h1 className="serif">{hub ? hub.label : c.name.replace(/ \/\/ LiveModern$/, "")}</h1>
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
            <div className="v serif">
              {countyShort(c.county) ?? collectionCounty(c.slug) ?? "South Florida"}
            </div>
          </div>
          <div className="stat">
            <p className="caps">Status</p>
            <div className="v serif">
              {inventory.activeCount > 0
                ? `${inventory.activeCount} Available`
                : isBuilding
                  ? stageLabel(c.facts) ?? "Now Selling"
                  : "Curated"}
            </div>
          </div>
          <div className="stat">
            <p className="caps">{priceFrom ? "Priced from" : "Pricing"}</p>
            <div className="v serif">{priceFrom ? money(priceFrom) : "On request"}</div>
          </div>
        </div>
      </div>

      <SubNav
        items={
          hub
            ? [
                { href: "#story", label: "The Story" },
                { href: "#the-index", label: "The Index" },
                { href: "#inquire", label: "Inquire" },
              ]
            : [
                { href: "#story", label: "The Story" },
                ...(gallery.length ? [{ href: "#gallery", label: "Gallery" }] : []),
                { href: "#availability", label: "Availability" },
                ...(floorplans.length ? [{ href: "#floorplans", label: "Floor Plans" }] : []),
                ...(inventory.recentSales.length ? [{ href: "#recent-sales", label: "Recent Sales" }] : []),
                { href: "#inquire", label: "Inquire" },
              ]
        }
      />

      <div className="wrap" id="story">
        <section className="feature">
          <div className="spread">
            <div>
              {standfirst ? <p className="standfirst">{standfirst}</p> : null}
              <p className="byline">
                Words by Modern Living Group
                {c.city ? ` · ${c.city}` : ""}
              </p>
              <ReadMore className="body" paragraphs={c.body} keep={3} />
            </div>

            <aside className="sheet">
              <h4>The Facts</h4>
              <dl>
                {isBuilding && stageLabel(c.facts) ? (
                  <div className="f">
                    <dt>Stage</dt>
                    <dd>{stageLabel(c.facts)}</dd>
                  </div>
                ) : null}
                {c.facts?.developer ? (
                  <div className="f">
                    <dt>Developer</dt>
                    <dd>{c.facts.developer}</dd>
                  </div>
                ) : null}
                {c.facts?.architect ? (
                  <div className="f">
                    <dt>Architect</dt>
                    <dd>
                      {c.facts.architect}
                      {c.facts.architect2 ? ` · ${c.facts.architect2}` : ""}
                    </dd>
                  </div>
                ) : null}
                {c.facts?.unit_count ? (
                  <div className="f">
                    <dt>Residences</dt>
                    <dd>{c.facts.unit_count}</dd>
                  </div>
                ) : null}
                {c.facts?.stories ? (
                  <div className="f">
                    <dt>Stories</dt>
                    <dd>{c.facts.stories}</dd>
                  </div>
                ) : null}
                {c.facts?.completion ? (
                  <div className="f">
                    <dt>Completion</dt>
                    <dd>{c.facts.completion}</dd>
                  </div>
                ) : null}
                {c.city ? (
                  <div className="f">
                    <dt>Location</dt>
                    <dd>{c.county ? `${c.city}, ${c.county}` : c.city}</dd>
                  </div>
                ) : null}
                <div className="f">
                  <dt>Pricing</dt>
                  <dd>{priceFrom ? money(priceFrom) : "On request"}</dd>
                </div>
              </dl>
              {c.facts?.developer ? (
                <p className="sheet-credit">
                  Development by {c.facts.developer}. Modern Living Group represents buyers
                  alongside the developer &mdash; we are not the developer.
                </p>
              ) : null}
              <a className="btn btn-dark" href="#inquire">
                {statusPill(c.facts) === "Pre-Construction" && isBuilding
                  ? "Request the package"
                  : "Request pricing"}
              </a>
            </aside>
          </div>
        </section>
      </div>

      {breakImage ? (
        <>
          <figure className="bleed">
            <Img src={breakImage} alt={displayName} sizes="100vw" widths={[640, 960, 1200, 1600, 1920]} />
          </figure>
          <div className="wrap">
            <p className="caption">
              <span>
                Inside <em>{displayName}</em>.
              </span>
              <span>Fig. 2</span>
            </p>
          </div>
        </>
      ) : null}

      {hub ? (
        <div className="wrap">
          <section className="sec" id="the-index">
            <div className="sec-head">
              <div>
                <p className="eyebrow">The {hub.label} Index</p>
                <h2 className="serif">
                  {hubBuildings.length} buildings, by area.
                </h2>
              </div>
            </div>
            <CityIndex buildings={hubBuildings} />
          </section>

          {hubCollections.length ? (
            <section className="sec" style={{ paddingTop: 0 }}>
              <div className="sec-head">
                <div>
                  <p className="eyebrow">Curated</p>
                  <h2 className="serif">Browse by lifestyle.</h2>
                </div>
              </div>
              <div className="cidx-grid">
                {hubCollections.map((x) => (
                  <Link key={x.slug} href={`/${x.slug}`} className="cidx-card">
                    <span className="cidx-im">
                      <img src={`https://images.livemodern.com/cdn-cgi/image/width=480,quality=80,format=auto/${x.hero}`} alt={x.name} loading="lazy" />
                    </span>
                    <span className="cidx-bd">
                      <span className="cidx-name serif">{x.name.replace(/ \/\/ LiveModern$/, "")}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {!hub && gallery.length ? (
        <div className="wrap">
          <section className="sec" id="gallery">
            <div className="sec-head">
              <div>
                <p className="eyebrow">Gallery &middot; {gallery.length} images</p>
                <h2 className="serif">Inside the building.</h2>
              </div>
            </div>
            <Gallery images={gallery} name={displayName} />
          </section>
        </div>
      ) : null}

      {isBuilding ? (
      <div className="wrap">
        <section className="sec" id="availability" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <div>
              <p className="eyebrow">Availability</p>
              <h2 className="serif">
                {inventory.activeCount > 0
                  ? `${inventory.activeCount} residence${inventory.activeCount === 1 ? "" : "s"} available.`
                  : inventory.pendingCount > 0
                    ? "Currently under contract."
                    : "Residences for sale."}
              </h2>
            </div>
            {inventory.pendingCount > 0 ? (
              <p className="sec-note">
                {inventory.pendingCount} under contract
              </p>
            ) : null}
          </div>

          {inventory.forSale.length > 0 ? (
            <UnitGrid noun="residences for sale">
              {inventory.forSale.map((u) => (
                <UnitCard key={u.mls_id} u={u} fallback={c.hero} />
              ))}
            </UnitGrid>
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
                  <UnitCard key={u.mls_id} u={u} rent fallback={c.hero} />
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
            <UnitGrid noun="sales">
              {inventory.recentSales.map((u) => (
                <UnitCard key={u.mls_id} u={u} sold fallback={c.hero} />
              ))}
            </UnitGrid>
          </section>
        ) : null}

        {floorplans.length ? (
          <section className="sec" id="floorplans" style={{ paddingTop: 0 }}>
            <div className="sec-head">
              <div>
                <p className="eyebrow">Floor Plans</p>
                <h2 className="serif">Residences &amp; layouts.</h2>
              </div>
              <p className="sec-note">
                {floorplans.length} plan{floorplans.length === 1 ? "" : "s"}
              </p>
            </div>
            <Floorplans plans={floorplans} buildingName={c.name} />
          </section>
        ) : null}
      </div>
      ) : null}

      {spokeHub && spokeListings.length ? (
        <div className="wrap">
          <section className="sec">
            <div className="sec-head">
              <div>
                <p className="eyebrow">On the market &middot; {spokeListings.length}</p>
                <h2 className="serif" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
                  {spokeHub.theme} in {spokeCountyShort ?? "South Florida"}.
                </h2>
              </div>
            </div>
            <LifestyleListings listings={spokeListings} />
          </section>
        </div>
      ) : null}

      {spokeHub && spokeStats && spokeContent ? (
        <SpokeEnrichment
          stats={spokeStats}
          content={spokeContent}
          county={spokeCountyShort}
        />
      ) : null}

      <LeadBand
        eyebrow={c.name}
        heading="Request pricing and floor plans."
        copy="Available lines, pricing, deposit schedule, and delivery timing — sent directly, not through a portal."
        cta="Send me availability"
        withInterest
      />

      {sib && sibItems.length ? (
        <div className="band">
          <div className="wrap">
            <section className="sec" style={{ paddingBottom: 0 }}>
              <div className="sec-head">
                <div>
                  <p className="eyebrow">More {sib.theme}</p>
                  <h2 className="serif">Keep exploring.</h2>
                </div>
                <Link className="link" href="/collections">
                  All collections &nbsp;&rarr;
                </Link>
              </div>
              <div className="col-rail">
                {sibItems.map((x) => (
                  <Link className="tile" key={x.slug} href={`/${x.slug}`}>
                    <Img
                      src={x.hero}
                      alt={x.name.replace(" // LiveModern", "")}
                      fill
                      sizes="(max-width:640px) 100vw, 33vw"
                    />
                    <div className="tile-in">
                      <p className="caps">{x.county ?? "South Florida"}</p>
                      <h3>{x.name.replace(" // LiveModern", "")}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}

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
