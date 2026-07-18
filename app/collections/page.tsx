import Link from "next/link";
import Img from "@/components/Img";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import { getBySlug, COLLECTION_THEMES, themeAnchor, type Community } from "@/lib/communities";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Collections — LiveModern",
  description:
    "South Florida luxury curated by lifestyle — waterfront, oceanfront, boating, golf, equestrian, and city living across Palm Beach, Fort Lauderdale, and Miami.",
};

function label(c: Community) {
  return c.name.replace(" // LiveModern", "");
}

export default function Collections() {
  const themes = COLLECTION_THEMES.map((t) => ({
    ...t,
    items: t.slugs.map(getBySlug).filter(Boolean) as Community[],
  })).filter((t) => t.items.length);

  return (
    <>
      <Masthead active="collections" />

      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 24 }}>
          <p className="eyebrow">Collections</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 16 }}>
            Curated by
            <br />
            how you live.
          </h1>
          <p style={{ marginTop: 14, maxWidth: "56ch", color: "var(--muted)", fontSize: 15 }}>
            South Florida&rsquo;s modern condos and homes, gathered by lifestyle &mdash; waterfront,
            oceanfront, boating, golf, equestrian, and city living, from Palm Beach to Miami.
          </p>
        </section>
      </div>

      <div className="wrap">
        <div className="col-layout">
          <div className="col-main">
            {themes.map((t) => (
              <section className="col-theme" id={themeAnchor(t.theme)} key={t.theme}>
                <div className="col-theme-head">
                  <h2 className="serif">{t.theme}</h2>
                  <p>{t.blurb}</p>
                </div>
                <div className="col-rail">
                  {t.items.map((c) => (
                    <Link className="tile" key={c.slug} href={`/${c.slug}`}>
                      <Img
                        src={c.hero}
                        alt={label(c)}
                        fill
                        sizes="(max-width:640px) 100vw, (max-width:1040px) 50vw, 33vw"
                      />
                      <div className="tile-in">
                        <p className="caps">{c.county ?? "South Florida"}</p>
                        <h3>{label(c)}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="col-nav" aria-label="Collections">
            <p className="col-nav-h">Browse</p>
            <nav>
              {themes.map((t) => (
                <a key={t.theme} href={`#${themeAnchor(t.theme)}`} className="col-nav-link">
                  {t.theme}
                  <span className="col-nav-n">{t.items.length}</span>
                </a>
              ))}
            </nav>
            <div className="col-nav-cta">
              <p>Looking for something specific?</p>
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
