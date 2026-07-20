import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import DesignGrid from "@/components/DesignGrid";
import {
  DESIGN_FAMILIES,
  familyBySlug,
  homesByStyle,
  styleCounts,
} from "@/lib/design";

export const revalidate = 900;

export function generateStaticParams() {
  return DESIGN_FAMILIES.map((f) => ({ family: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ family: string }>;
}): Promise<Metadata> {
  const { family } = await params;
  const f = familyBySlug(family);
  if (!f) return { title: "By Design — LiveModern" };
  return {
    title: `${f.family} Homes — South Florida | LiveModern`,
    description: f.blurb,
  };
}

export default async function DesignFamilyPage({
  params,
}: {
  params: Promise<{ family: string }>;
}) {
  const { family } = await params;
  const f = familyBySlug(family);
  if (!f) notFound();

  const counts = await styleCounts();
  const stylesPresent = f.styles.filter((s) => (counts[s] ?? 0) > 0);
  const homes = await homesByStyle(f.styles, 90);

  return (
    <>
      <Masthead active="collections" loginBand />

      <div className="wrap">
        <p className="crumb">
          <Link href="/design">By Design</Link>
          <span className="sl">/</span>
          <span>{f.family}</span>
        </p>
      </div>

      <div className="wrap">
        <section className="sec" style={{ paddingBottom: 20 }}>
          <p className="eyebrow">By Design</p>
          <h1 className="serif" style={{ fontSize: "clamp(32px,5.5vw,58px)", marginTop: 14 }}>
            {f.family}
          </h1>
          <p style={{ marginTop: 14, maxWidth: "56ch", color: "var(--muted)", fontSize: 15 }}>
            {f.blurb}
          </p>
          {/* style sub-nav within the family */}
          <div className="dz-substyles">
            {stylesPresent.map((s) => (
              <span key={s} className="dz-substyle">
                {s}
                <span className="dz-chip-n">{counts[s]}</span>
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="wrap">
        <section className="sec" style={{ paddingTop: 0 }}>
          {homes.length ? (
            <DesignGrid homes={homes} />
          ) : (
            <div className="avail">
              <div className="avail-txt">
                <p className="caps">Nothing active right now</p>
                <h3 className="serif">This style trades quietly.</h3>
                <p>
                  {f.family} homes at this level don&rsquo;t stay on the market long. Tell us what
                  you&rsquo;re after and we&rsquo;ll watch for the next one.
                </p>
                <a className="btn btn-dark" href="#inquire">
                  Set an alert
                </a>
              </div>
            </div>
          )}
        </section>
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading={`Looking for ${f.family.toLowerCase()}?`}
        copy="We track every architecturally significant home from Palm Beach to Miami. Tell us the style and market, and we'll send the shortlist."
      />
      <Footer />
    </>
  );
}
