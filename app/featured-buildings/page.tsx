import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import IndexFilter from "@/components/IndexFilter";
import { getBuildings, COUNTIES, resolveLifecycle, isFeatured } from "@/lib/communities";
import { buildingBuiltYears } from "@/lib/listings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Modern Classics — Signature Residences",
  description:
    "The signature luxury towers that defined modern living across Palm Beach, Fort Lauderdale, and Miami — completed, occupied, and still setting the standard.",
};

export default async function FeaturedBuildings() {
  const all = getBuildings();
  const builtYears = await buildingBuiltYears(all.map((b) => b.slug));
  const lifecycles: Record<string, { pill: string | null; phase: string }> = {};
  const buildings = all.filter((b) => {
    const lc = resolveLifecycle(b.facts, builtYears[b.slug] ?? null);
    lifecycles[b.slug] = { pill: lc.pill, phase: lc.phase };
    return isFeatured(b.facts, lc);
  });

  return (
    <>
      <Masthead active="featured" />
      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 0 }}>
          <p className="eyebrow">Signature Residences</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 16 }}>
            Modern Classics
          </h1>
          <p style={{ marginTop: 14, maxWidth: "56ch", color: "var(--muted)", fontSize: 15 }}>
            The towers that defined modern luxury from Palm Beach to Miami — delivered, occupied,
            and still setting the standard. Not new construction anymore, but the addresses buyers
            still ask for by name. {buildings.length} in the collection.
          </p>
        </section>

        <IndexFilter buildings={buildings} counties={[...COUNTIES]} lifecycles={lifecycles} />

        <div style={{ height: 80 }} />
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading="Buying or selling in a signature building?"
        copy="We've closed in these towers since they delivered — we know the lines, the views, the HOA realities, and what actually trades. Tell us the address."
      />
      <Footer />
    </>
  );
}
