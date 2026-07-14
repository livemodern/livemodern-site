import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadBand from "@/components/LeadBand";
import { getCollections } from "@/lib/communities";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Modern Homes — Collections",
  description:
    "Waterfront, beachfront, boating, golf, equestrian, and newly built homes across Palm Beach, Broward, and Miami-Dade.",
};

export default function ModernHomes() {
  const collections = getCollections();
  return (
    <>
      <Masthead active="homes" />
      <div className="wrap">
        <section className="sec">
          <p className="eyebrow">Modern Homes &middot; {collections.length} collections</p>
          <h1 className="serif" style={{ fontSize: "clamp(34px,6vw,64px)", marginTop: 16 }}>
            Ground level,
            <br />
            no less modern.
          </h1>
          <p style={{ marginTop: 14, maxWidth: "54ch", color: "var(--muted)", fontSize: 15 }}>
            Waterfront, beachfront, boating, golf, equestrian, and newly built &mdash; curated across
            Palm Beach, Broward, and Miami-Dade.
          </p>

          <div className="rail">
            {collections.map((c) => (
              <Link className="tile" key={c.slug} href={`/${c.slug}`}>
                <Image
                  src={c.hero}
                  alt={c.name}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1040px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
                <div className="tile-in">
                  <p className="caps">{c.county ?? "South Florida"}</p>
                  <h3>{c.name.replace(" // LiveModern", "")}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <LeadBand
        eyebrow="Speak with us"
        heading="Tell us what you're looking for."
        copy="Waterfront, dockage, golf, acreage — the good ones move before they're public. We'll watch for yours."
      />
      <Footer />
    </>
  );
}
