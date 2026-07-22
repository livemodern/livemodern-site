import Link from "next/link";
import Img from "@/components/Img";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import {
  getBySlug,
  LIFESTYLE_HUBS,
  CURATED_SEARCHES,
  themeAnchor,
  type Community,
} from "@/lib/communities";
import { DESIGN_FAMILIES, styleCounts } from "@/lib/design";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Collections — LiveModern",
  description:
    "South Florida luxury curated by lifestyle — boating, waterfront, beach, downtown, golf, island, and estate living across Palm Beach, Fort Lauderdale, and Miami.",
};

const clean = (c: Community) => c.name.replace(" // LiveModern", "");

export default async function Collections() {
  // lifestyle hubs that have at least one spoke to show
  const hubs = LIFESTYLE_HUBS.map((h) => ({
    ...h,
    items: h.spokes.map(getBySlug).filter(Boolean) as Community[],
  })).filter((h) => h.items.length);

  const curated = CURATED_SEARCHES.map(getBySlug).filter(Boolean) as Community[];

  // By Design — live style counts, families with inventory only
  const counts = await styleCounts();
  const families = DESIGN_FAMILIES.map((f) => ({
    ...f,
    n: f.styles.reduce((sum, s) => sum + (counts[s] ?? 0), 0),
  })).filter((f) => f.n > 0);

  return (
    <>
      <Masthead active="collections" />

      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 24 }}>
          <p className="eyebrow">Collections</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 16 }}>
            Curated by
            <br />
            architecture.
          </h1>
          <p style={{ marginTop: 14, maxWidth: "58ch", color: "var(--muted)", fontSize: 15 }}>
            Most searches filter by beds and price. Ours reads the architecture &mdash; every home
            classified by style, so you can look for the British West Indies estate or the
            glass-walled modern, not just &ldquo;5 bed, waterfront.&rdquo;
          </p>
        </section>
      </div>

      <div className="wrap">
        <div className="col-layout">
          <div className="col-main">
            {/* ── BY LIFESTYLE ── */}
            {/* ── BY DESIGN (lead section) ── */}
            {families.length ? (
              <section className="col-theme" id="theme-design">
                <div className="dz-grid">
                  {families.map((f) => (
                    <Link key={f.slug} className="dz-card" href={`/design/${f.slug}`}>
                      <div className="dz-card-bd">
                        <p className="dz-n">{f.n} homes</p>
                        <h3 className="serif">{f.family}</h3>
                        <p className="dz-blurb">{f.blurb}</p>
                        <div className="dz-styles">
                          {f.styles
                            .filter((s) => (counts[s] ?? 0) > 0)
                            .map((s) => (
                              <span key={s} className="dz-chip">
                                {s} <span className="dz-chip-n">{counts[s]}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {/* ── LIFESTYLE INTRO ── */}
            <section className="col-lead" id="theme-lifestyle">
              <p className="eyebrow">By Lifestyle</p>
              <h2 className="serif">Curated by how you live.</h2>
              <p>
                South Florida&rsquo;s modern condos and homes, gathered by lifestyle &mdash; then
                narrowed by market. Start with the life you&rsquo;re after; we&rsquo;ll take it from
                there.
              </p>
            </section>

            {hubs.map((h) => (
              <section className="col-theme" id={themeAnchor(h.theme)} key={h.slug}>
                <div className="col-theme-head">
                  <div className="col-theme-titles">
                    <h2 className="serif">{h.theme}</h2>
                    <p>{h.blurb}</p>
                  </div>
                  <Link className="col-theme-all link" href={`/${h.slug}`}>
                    View all &rarr;
                  </Link>
                </div>
                <div className="col-rail">
                  {h.items.map((c) => (
                    <Link className="tile" key={c.slug} href={`/${c.slug}`}>
                      <Img
                        src={c.hero}
                        alt={clean(c)}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1040px) 50vw, 33vw"
                      />
                      <div className="tile-in">
                        <p className="caps">{c.county ?? "South Florida"}</p>
                        <h3>{clean(c)}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            {/* ── CURATED SEARCHES ── */}
            {curated.length ? (
              <section className="col-theme" id="theme-curated">
                <div className="col-theme-head">
                  <div className="col-theme-titles">
                    <h2 className="serif">Curated Searches</h2>
                    <p>Named market slices &mdash; ready-made searches worth saving.</p>
                  </div>
                </div>
                <div className="col-rail">
                  {curated.map((c) => (
                    <Link className="tile" key={c.slug} href={`/${c.slug}`}>
                      <Img
                        src={c.hero}
                        alt={clean(c)}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1040px) 50vw, 33vw"
                      />
                      <div className="tile-in">
                        <p className="caps">{c.county ?? "South Florida"}</p>
                        <h3>{clean(c)}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* STICKY SIDE-NAV — two groups: Lifestyle + Curated */}
          <aside className="col-nav" aria-label="Collections">
            <p className="col-nav-h">By Design</p>
            <nav>
              <a href="#theme-design" className="col-nav-link">
                Architectural styles
                <span className="col-nav-n">{families.length}</span>
              </a>
            </nav>
            <p className="col-nav-h" style={{ marginTop: 22 }}>By Lifestyle</p>
            <nav>
              {hubs.map((h) => (
                <a key={h.slug} href={`#${themeAnchor(h.theme)}`} className="col-nav-link">
                  {h.theme}
                  <span className="col-nav-n">{h.items.length}</span>
                </a>
              ))}
            </nav>
            {curated.length ? (
              <>
                <p className="col-nav-h" style={{ marginTop: 22 }}>
                  Curated
                </p>
                <nav>
                  <a href="#theme-curated" className="col-nav-link">
                    Market searches
                    <span className="col-nav-n">{curated.length}</span>
                  </a>
                </nav>
              </>
            ) : null}
            <div className="col-nav-cta">
              <p>Want to combine lifestyles?</p>
              <a href="#inquire" className="link">
                Tell us &nbsp;&rarr;
              </a>
            </div>
          </aside>
        </div>
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading="Tell us what you're looking for."
        copy="Waterfront, dockage, golf, acreage, a branded tower — the good ones move before they're public. We'll watch for yours, and represent you through the developer or seller."
      />
      <Footer />
    </>
  );
}
