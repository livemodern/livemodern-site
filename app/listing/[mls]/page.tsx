import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ReadMore from "@/components/ReadMore";
import { getBySlug } from "@/lib/communities";
import ListingGallery from "@/components/ListingGallery";
import {
  getListing,
  sampleListings,
  featuredAgentFor,
  listingKind,
  isPresale,
  money,
  pricePerSqft,
  fullAddress,
  streetOnly,
  mlsDisplay,
  amenityList,
  mls,
  mlsSrcSet,
  type Listing,
} from "@/lib/listings";

export const revalidate = 900;

// Only the baked samples are pre-rendered; live MLS ids render on-demand.
export function generateStaticParams() {
  return sampleListings().map((l) => ({ mls: l.mls_id }));
}
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mls: string }>;
}): Promise<Metadata> {
  const { mls: id } = await params;
  const l = await getListing(id);
  if (!l) return {};
  const title = `${fullAddress(l)}, ${l.city} — ${money(l.list_price)}`;
  return {
    title,
    description: (l.description ?? "").slice(0, 180),
    openGraph: {
      title: `${title} | LiveModern`,
      images: l.image_urls?.[0] ? [mls(l.image_urls[0], 1200)] : undefined,
    },
  };
}

function Spec({ n, l }: { n: string; l: string }) {
  return (
    <div className="keyspec">
      <div className="n serif">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ mls: string }>;
}) {
  const { mls: id } = await params;
  const l = await getListing(id);
  if (!l) notFound();

  const kind = listingKind(l);
  const presale = isPresale(l);
  const agent = featuredAgentFor(l);
  const photos = (l.image_urls ?? []).slice(0, 24);
  const hero = photos[0];
  const community = l.community_slug ? getBySlug(l.community_slug) : undefined;
  const amenities = amenityList(l.building_amenities);
  const wf = l.waterfront_features
    ? l.waterfront_features.replace(/([a-z])([A-Z])/g, "$1 $2")
    : null;
  const year = new Date().getFullYear();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": presale ? "Residence" : "SingleFamilyResidence",
    name: fullAddress(l),
    ...(l.description ? { description: l.description.slice(0, 300) } : {}),
    ...(hero ? { image: mls(hero, 1200) } : {}),
    ...(l.listing_id
      ? { identifier: { "@type": "PropertyValue", propertyID: "BeachesMLS", value: l.listing_id } }
      : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: fullAddress(l),
      addressLocality: l.city ?? undefined,
      addressRegion: l.state ?? "FL",
      postalCode: l.zip ?? undefined,
    },
    // The agent we surface to the buyer is our featured agent — a lead-gen site.
    realEstateAgent: {
      "@type": "RealEstateAgent",
      name: agent.name,
      telephone: agent.phoneHref,
      email: agent.email,
      image: agent.photo,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Masthead active={presale ? "nc" : undefined} loginBand />

      <div className="wrap">
        <p className="crumb">
          {l.city ? <span>{l.city}</span> : null}
          {community ? (
            <>
              {l.city ? <span className="sl">/</span> : null}
              <Link href={`/${community.slug}`}>{community.name}</Link>
            </>
          ) : null}
          {l.city || community ? <span className="sl">/</span> : null}
          {streetOnly(l)}
        </p>
      </div>

      {/* GALLERY — desktop popup, mobile fold-out */}
      <ListingGallery
        photos={photos}
        statusLabel={
          presale ? "For Sale · Pre-Construction" : kind === "home" ? "For Sale · Home" : "For Sale · Condo"
        }
        address={fullAddress(l)}
      />

      {/* HEADER */}
      <div className="wrap">
        <div className="head">
          <div>
            <div className="price serif">{money(l.list_price)}</div>
            <div className="addr">{fullAddress(l)}</div>
            <div className="sub">
              {l.city}, {l.state} {l.zip}
              {wf ? ` · ${wf}` : ""}
            </div>
            {community ? (
              <Link className="bldg" href={`/${community.slug}`}>
                At {community.name} &nbsp;&rarr;
              </Link>
            ) : null}
          </div>
          <div className="keyspecs">
            <Spec n={l.beds != null ? String(l.beds) : "—"} l="Beds" />
            <Spec n={l.baths != null ? String(l.baths) : "—"} l="Baths" />
            <Spec n={l.sqft ? l.sqft.toLocaleString() : "—"} l="Sq Ft" />
            <Spec n={pricePerSqft(l)} l="/ Sq Ft" />
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="wrap">
        <div className="l-layout">
          <div className="blocks">
            {l.description ? (
              <section className="remarks">
                <h2 className="sec-h serif">About this {presale ? "residence" : kind}</h2>
                <ReadMore text={l.description} collapsedHeight={230} />
              </section>
            ) : null}

            <section>
              <h2 className="sec-h serif">The facts</h2>
              <dl className="facts">
                <Fact label="Price">{money(l.list_price)}</Fact>
                <Fact label="Price / Sq Ft">{pricePerSqft(l)}</Fact>
                <Fact label="Bedrooms">{l.beds ?? "—"}</Fact>
                <Fact label="Bathrooms">{l.baths ?? "—"}</Fact>
                <Fact label="Interior">{l.sqft ? `${l.sqft.toLocaleString()} sq ft` : "—"}</Fact>
                {l.unit_number ? <Fact label="Residence">#{l.unit_number}</Fact> : null}
                <Fact label="Type">
                  {presale ? "Pre-Construction" : l.property_subtype ?? l.property_type ?? "—"}
                </Fact>
                <Fact label="Year Built">
                  {l.year_built ?? "—"}
                  {presale ? " (Pre-Construction)" : ""}
                </Fact>
                {l.building_name ? <Fact label="Building">{l.building_name}</Fact> : null}
                {l.stories ? <Fact label="Stories">{l.stories}</Fact> : null}

                {/* HOME-only: lot size + pool. Condo/presale: HOA. */}
                {kind === "home" && l.lot_size_acres ? (
                  <Fact label="Lot Size">{l.lot_size_acres} acres</Fact>
                ) : null}
                {kind === "home" && l.has_pool != null ? (
                  <Fact label="Pool">{l.has_pool ? "Yes" : "No"}</Fact>
                ) : null}
                {l.hoa_fee ? <Fact label="HOA">{money(l.hoa_fee)} / mo</Fact> : null}
                {l.garage_spaces ? <Fact label="Garage">{l.garage_spaces} spaces</Fact> : null}
                {l.flooring ? <Fact label="Flooring">{l.flooring.replace(/,/g, ", ")}</Fact> : null}
                {wf ? <Fact label="Waterfront">{wf}</Fact> : null}

                {/* Tax: shown for real/resale only. Presales have no tax record yet. */}
                {!presale && l.tax_annual ? (
                  <Fact label="Annual Tax">{money(l.tax_annual)}</Fact>
                ) : null}

                {l.days_on_market != null ? <Fact label="Days on Market">{l.days_on_market}</Fact> : null}
                <Fact label="MLS #">{mlsDisplay(l)}</Fact>
              </dl>
            </section>

            {amenities.length ? (
              <section>
                <h2 className="sec-h serif">{l.building_name ? "Building amenities" : "Amenities"}</h2>
                <ul className="amen">
                  {amenities.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            ) : null}


          </div>

          {/* FEATURED AGENT — always ours, never the listing agent */}
          <aside>
            <div className="agent">
              <div className="a-head">
                {agent.photo ? (
                  <img className="a-photo" src={mls(agent.photo, 200)} alt={agent.name} />
                ) : null}
                <div>
                  <p className="kicker">Featured Agent</p>
                  <div className="who serif">{agent.name}</div>
                  <div className="firm">{agent.title}</div>
                </div>
              </div>
              <div className="ph">
                <a href={`tel:${agent.phoneHref}`}>{agent.phone}</a>
              </div>

              <div className="actions">
                <a className="ghost" href={`tel:${agent.phoneHref}`}>
                  Call
                </a>
                <a className="ghost" href="#tour">
                  Schedule tour
                </a>
              </div>

              <form className="a-form" action="/api/leads" method="post" id="tour">
                <input type="hidden" name="mls_id" value={l.mls_id} />
                <input type="hidden" name="address" value={fullAddress(l)} />
                <input name="name" placeholder="Name" aria-label="Name" required />
                <input name="email" type="email" placeholder="Email" aria-label="Email" required />
                <input name="phone" placeholder="Phone" inputMode="tel" aria-label="Phone" />
                <textarea
                  name="message"
                  rows={2}
                  placeholder={`I'd like to know more about ${fullAddress(l)}.`}
                  aria-label="Message"
                  defaultValue=""
                />
                <button className="btn btn-dark" type="submit">
                  Request info
                </button>
                <p className="a-fine">We reply the same day. No auto-dialers, no spam.</p>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* COMPLIANCE — the ONLY place the listing brokerage/agent appears (§20) */}
      <div className="compliance">
        <div className="c-in">
          <img className="bmls" src="https://images.mlrecloud.com/brand/bmls-logo.png" alt="BeachesMLS" />
          <p>
            {l.list_office_name ? (
              <span className="courtesy">
                Listing courtesy of {l.list_office_name}
                {l.list_agent_email ? ` · ${l.list_agent_email}` : ""}.{" "}
              </span>
            ) : null}
            All listings featuring the BMLS logo are provided by BeachesMLS, Inc. This information is
            not verified for authenticity or accuracy and is not guaranteed. Copyright &copy;{year}{" "}
            BeachesMLS, Inc.
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
