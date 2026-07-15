import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import { getArticles, getLead, CATEGORIES, CATEGORY_BLURB, formatDate, cfImg } from "@/lib/journal-helpers";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Journal — LiveModern",
  description:
    "Building spotlights, area guides, and pre-construction intelligence from South Florida's new-construction market — Palm Beach to Miami.",
};

export default function Journal() {
  const lead = getLead();
  const rest = getArticles().filter((a) => a.slug !== lead?.slug);

  return (
    <>
      <Masthead active="journal" />

      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 0 }}>
          <p className="eyebrow">The Journal</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 16 }}>
            Notes on what&rsquo;s rising.
          </h1>
          <p style={{ marginTop: 14, maxWidth: "56ch", color: "var(--muted)", fontSize: 15 }}>
            Building spotlights, area guides, and conversations with the developers shaping South
            Florida&rsquo;s next skyline.
          </p>
        </section>

        {/* FEATURED STORY */}
        {lead ? (
          <section className="sec" style={{ paddingTop: 40 }}>
            <Link className="jr-lead" href={`/journal/${lead.slug}`}>
              <div className="jr-lead-im">
                <img src={cfImg(lead.hero, 1600)} alt={lead.title} loading="eager" />
                {lead.videoId ? <span className="jr-play" aria-hidden="true">▶</span> : null}
              </div>
              <div className="jr-lead-bd">
                <p className="jr-cat">{lead.category}</p>
                <h2 className="serif">{lead.title}</h2>
                <p className="jr-dek">{lead.dek}</p>
                <p className="jr-meta">
                  {lead.author} &middot; {formatDate(lead.date)} &middot; {lead.readMinutes} min
                </p>
              </div>
            </Link>
          </section>
        ) : null}

        {/* CATEGORY SECTIONS */}
        {CATEGORIES.map((cat) => {
          const items = rest.filter((a) => a.category === cat);
          if (!items.length) return null;
          return (
            <section className="sec" key={cat} style={{ paddingBottom: 0 }}>
              <div className="sec-head">
                <div>
                  <p className="eyebrow">{cat}</p>
                  <h2 className="serif" style={{ fontSize: "clamp(22px,3vw,34px)" }}>
                    {CATEGORY_BLURB[cat]}
                  </h2>
                </div>
              </div>
              <div className="jr-grid">
                {items.map((a) => (
                  <Link key={a.slug} className="jr-card" href={`/journal/${a.slug}`}>
                    <span className="jr-card-im">
                      <img src={cfImg(a.hero, 720)} alt={a.title} loading="lazy" />
                      {a.videoId ? <span className="jr-play sm" aria-hidden="true">▶</span> : null}
                    </span>
                    <span className="jr-card-bd">
                      <span className="jr-cat">{a.category}</span>
                      <span className="jr-card-t serif">{a.title}</span>
                      <span className="jr-card-d">{a.dek}</span>
                      <span className="jr-meta">
                        {formatDate(a.date)} &middot; {a.readMinutes} min
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <div style={{ height: 80 }} />
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading="Want the story behind a specific tower?"
        copy="We track every new development from Palm Beach to Miami — developer, delivery, allocation, and what's actually worth the wait. Tell us what you're considering and we'll walk you through it, over video or in person."
      />
      <Footer />
    </>
  );
}
