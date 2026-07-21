import type { LifestyleStats } from "@/lib/listings";
import type { LifestyleContent } from "@/lib/spoke-content";
import SpokeFaqs from "@/components/SpokeFaqs";

function money(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m >= 100 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  return `$${Math.round(n / 1000)}K`;
}

const ATTR_LABEL: Record<string, string> = {
  pool: "Pool",
  gated: "Gated",
  "pet-friendly": "Pet-friendly",
  penthouse: "Penthouse",
  acreage: "Acreage",
};

/**
 * The "juice" layer for a lifestyle spoke: a live market stats bar, the insider
 * "what defines this here" explainer, and an FAQ set (with FAQPage JSON-LD).
 * All data-driven — stats from lifestyleStats(), prose from spoke-content.
 */
export default function SpokeEnrichment({
  stats,
  content,
  county,
}: {
  stats: LifestyleStats;
  content: LifestyleContent;
  county: string | null;
}) {
  const where = county ?? "South Florida";
  const isBoatingOrWater =
    content.theme === "Boating & Deepwater" || content.theme === "Waterfront";

  // Build the stat cells that make sense for this lifestyle
  const cells: { v: string; l: string }[] = [];
  if (stats.count) cells.push({ v: String(stats.count), l: "On the market" });
  if (stats.minPrice && stats.maxPrice)
    cells.push({ v: `${money(stats.minPrice)}–${money(stats.maxPrice)}`, l: "Price range" });
  if (stats.medianPrice) cells.push({ v: money(stats.medianPrice), l: "Median" });
  if (isBoatingOrWater && stats.oceanAccess)
    cells.push({ v: String(stats.oceanAccess), l: "Ocean access" });
  if (content.theme === "Boating & Deepwater" && stats.noFixedBridges)
    cells.push({ v: String(stats.noFixedBridges), l: "No fixed bridges" });
  if (!isBoatingOrWater && stats.attributes.gated)
    cells.push({ v: String(stats.attributes.gated), l: "Gated" });
  if (stats.attributes.pool && cells.length < 5)
    cells.push({ v: String(stats.attributes.pool), l: "With pool" });

  return (
    <>
      {/* ── LIVE MARKET STATS BAR ── */}
      {cells.length ? (
        <div className="wrap">
          <div className="spoke-stats">
            {cells.map((c) => (
              <div className="spoke-stat" key={c.l}>
                <div className="spoke-stat-v serif">{c.v}</div>
                <div className="spoke-stat-l">{c.l}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── INSIDER EXPLAINER ── */}
      <div className="wrap">
        <section className="sec spoke-insider">
          <div className="spoke-insider-head">
            <p className="eyebrow">The insider view</p>
            <h2 className="serif">{content.insiderHeading}.</h2>
            <p className="spoke-deck">{content.deck}</p>
          </div>
          <div className="spoke-points">
            {content.insider.map((p) => (
              <div className="spoke-point" key={p.term}>
                <h3 className="serif">{p.term}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── TOP AREAS (internal linking + genuinely useful) ── */}
      {stats.topCities.length > 1 ? (
        <div className="wrap">
          <section className="sec" style={{ paddingTop: 0 }}>
            <p className="eyebrow">Where it concentrates</p>
            <p className="spoke-areas">
              {content.theme} in {where} centers on{" "}
              {stats.topCities.slice(0, 4).map((c, i, arr) => (
                <span key={c.city}>
                  <strong>{c.city}</strong>
                  <span className="spoke-area-n"> ({c.n})</span>
                  {i < arr.length - 1 ? (i === arr.length - 2 ? ", and " : ", ") : "."}
                </span>
              ))}
            </p>
          </section>
        </div>
      ) : null}

      {/* ── FAQs (+ FAQPage JSON-LD) ── */}
      {content.faqs.length ? (
        <div className="wrap">
          <section className="sec spoke-faq-sec">
            <div className="sec-head">
              <div>
                <p className="eyebrow">Good to know</p>
                <h2 className="serif">Questions buyers ask.</h2>
              </div>
            </div>
            <SpokeFaqs faqs={content.faqs} />
          </section>
        </div>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: content.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </>
  );
}
