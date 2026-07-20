import Link from "next/link";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import { DESIGN_FAMILIES, styleCounts } from "@/lib/design";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "By Design — Architectural Styles | LiveModern",
  description:
    "Browse South Florida luxury homes by architectural style — Modern, Mediterranean, British West Indies, Art Deco and more. The only search that curates by design.",
};

export default async function DesignLanding() {
  const counts = await styleCounts();
  const familyCount = (styles: string[]) =>
    styles.reduce((n, s) => n + (counts[s] ?? 0), 0);

  const families = DESIGN_FAMILIES.map((f) => ({ ...f, n: familyCount(f.styles) })).filter(
    (f) => f.n > 0,
  );

  return (
    <>
      <Masthead active="collections" />

      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 24 }}>
          <p className="eyebrow">By Design</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 16 }}>
            Curated by
            <br />
            architecture.
          </h1>
          <p style={{ marginTop: 14, maxWidth: "58ch", color: "var(--muted)", fontSize: 15 }}>
            Most searches let you filter by beds and price. Ours reads the architecture. Every home
            is classified by style &mdash; so you can find the British West Indies estate or the
            glass-walled modern, not just &ldquo;5 bed, waterfront.&rdquo;
          </p>
        </section>
      </div>

      <div className="wrap">
        <div className="dz-grid">
          {families.map((f) => (
            <Link key={f.slug} className="dz-card" href={`/design/${f.slug}`}>
              <div className="dz-card-bd">
                <p className="dz-n">{f.n} homes</p>
                <h2 className="serif">{f.family}</h2>
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
                <span className="dz-go link">Explore {f.family} &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ height: 70 }} />
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading="Have a style in mind?"
        copy="Tell us the look you're after — tropical modern, Mediterranean, British West Indies — and the market you want it in. We'll send what's available and what's coming."
      />
      <Footer />
    </>
  );
}
