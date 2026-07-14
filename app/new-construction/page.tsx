import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import IndexRow from "@/components/IndexRow";
import { getBuildings, COUNTIES } from "@/lib/communities";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "New Construction — The Index",
  description:
    "Every new tower under development, now selling, or newly delivered from Palm Beach to Miami.",
};

export default function NewConstruction() {
  const buildings = getBuildings();
  const byCounty = COUNTIES.map((county) => ({
    county,
    rows: buildings
      .filter((b) => b.county === county)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

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

        {byCounty.map(({ county, rows }) => (
          <section className="sec" key={county} style={{ paddingBottom: 0 }}>
            <div className="sec-head">
              <div>
                <p className="eyebrow">
                  {county} &middot; {rows.length} towers
                </p>
                <h2 className="serif">{county}</h2>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {rows.map((c) => (
                <IndexRow key={c.slug} c={c} />
              ))}
            </div>
          </section>
        ))}

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
