import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import { getAll, getBySlug, getRelated } from "@/lib/communities";

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
    title: `${c.name} | LiveModern`,
    description: c.metaDescription || `${c.name} — new construction in ${c.city ?? "South Florida"}.`,
    openGraph: {
      title: `${c.name} | LiveModern`,
      description: c.metaDescription,
      images: c.hero ? [c.hero] : undefined,
    },
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getBySlug(slug);
  if (!c) notFound();

  const related = getRelated(c, 3);
  const gallery = c.gallery.filter((g) => g !== c.hero).slice(0, 5);
  const breakImage = gallery[0];
  const grid = gallery.slice(1, 6);
  const [standfirst, ...rest] = c.body;
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
          <Link href="/new-construction">Index</Link>
          {c.county ? (
            <>
              <span className="sl">/</span>
              <Link href="/new-construction">{c.county}</Link>
            </>
          ) : null}
          {c.city ? (
            <>
              <span className="sl">/</span>
              <span>{c.city}</span>
            </>
          ) : null}
          <span className="sl">/</span>
          {c.name}
        </p>
      </div>

      <section className="cover-img">
        <Image src={c.hero} alt={c.name} fill priority sizes="100vw" style={{ objectFit: "cover" }} />
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
            <div className="v serif">{isBuilding ? "Now Selling" : "Curated"}</div>
          </div>
          <div className="stat">
            <p className="caps">Priced from</p>
            <div className="v serif">On request</div>
          </div>
        </div>
      </div>

      <nav className="subnav">
        <div className="subnav-in">
          <a href="#story">The Story</a>
          {gallery.length ? <a href="#gallery">Gallery</a> : null}
          <a href="#availability">Availability</a>
          <a href="#inquire">Inquire</a>
        </div>
      </nav>

      <div className="wrap" id="story">
        <section className="feature">
          <div className="spread">
            <div>
              {standfirst ? (
                <p className="standfirst">
                  {standfirst.split(". ").slice(0, 1).join(". ")}
                  {standfirst.endsWith(".") ? "" : "."}
                </p>
              ) : null}
              <p className="byline">
                Words by Modern Living Group
                {c.city ? ` · ${c.city}` : ""}
              </p>
              <div className="body">
                {(rest.length ? rest : c.body).map((p, i) => (
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
            <Image
              src={breakImage}
              alt={c.name}
              width={1600}
              height={900}
              sizes="100vw"
              style={{ width: "100%", height: "auto" }}
            />
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
                  <Image
                    src={g}
                    alt={`${c.name} — image ${i + 1}`}
                    width={800}
                    height={800}
                    sizes="(max-width:900px) 50vw, 25vw"
                    style={{ width: "100%", height: "auto" }}
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
              <h2 className="serif">Residences for sale.</h2>
            </div>
          </div>
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
                <Image
                  src={gallery[1] ?? c.hero}
                  alt=""
                  fill
                  sizes="(max-width:860px) 100vw, 45vw"
                  style={{ objectFit: "cover" }}
                />
              ) : null}
            </div>
          </div>
        </section>
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
                  <Image
                    src={r.hero}
                    alt={r.name}
                    width={600}
                    height={450}
                    sizes="(max-width:760px) 100vw, 33vw"
                    style={{ width: "100%", height: "auto" }}
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
