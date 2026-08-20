import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import IndexFilter from "@/components/IndexFilter";
import { getBuildings, COUNTIES, resolveLifecycle, needsBuiltYearLookup } from "@/lib/communities";
import { buildingBuiltYears } from "@/lib/listings";

// 6h (was 1h). New-construction lifecycle changes slowly (buildings graduate
// on year_built arrival — driven by MLS resale hits captured by bmb-delta).
export const revalidate = 21600;

export const metadata: Metadata = {
  title: "New Construction — The Index",
  description:
    "Every new tower under development, now selling, or newly delivered from Palm Beach to Miami.",
};

export default async function NewConstruction() {
  const all = getBuildings();
  // Locked buildings never need the MLS lookup — their delivery year is
  // settled. Skipping them keeps the query small and makes the lock real
  // rather than advisory.
  const builtYears = await buildingBuiltYears(
    all.filter(needsBuiltYearLookup).map((b) => b.slug),
  );
  const lifecycles: Record<string, { pill: string | null; phase: string }> = {};
  const buildings = all.filter((b) => {
    const lc = resolveLifecycle(b.facts, builtYears[b.slug] ?? null);
    lifecycles[b.slug] = { pill: lc.pill, phase: lc.phase };
    return !lc.graduated && lc.phase !== "unknown"; // graduated -> Featured; unknown -> not a real building
  });

  return (
    <>
      <Masthead active="nc" />
      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 0 }}>
          <p className="eyebrow">The Index</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 16 }}>
            New Construction
          </h1>
          <p style={{ marginTop: 14, maxWidth: "54ch", color: "var(--muted)", fontSize: 15 }}>
            Every tower under development, now selling, or newly delivered from Palm Beach to Miami.
            {" "}
            {buildings.length} in the register, updated as sales galleries open.
          </p>
        </section>

        <IndexFilter buildings={buildings} counties={[...COUNTIES]} lifecycles={lifecycles} />

        <div style={{ height: 80 }} />
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading="Buying new construction is a different transaction."
        copy="Developer contracts, deposit schedules, and allocation lists don't work like resale. We've been on the sell side of these towers since 2008."
      />
      <Footer />
    </>
  );
}
