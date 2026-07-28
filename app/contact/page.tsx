import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Contact — LiveModern",
  description:
    "Talk to LiveModern about South Florida's new towers and modern homes. Same-day replies from the team that's been on the sell side of these buildings since 2008.",
  alternates: { canonical: "https://www.livemodern.com/contact" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "LiveModern",
  description:
    "South Florida new construction and modern homes, curated by lifestyle and design. A brand of Modern Living Group at Compass.",
  url: "https://www.livemodern.com/contact",
  telephone: "+1-561-228-8420",
  areaServed: ["Palm Beach County", "Broward County", "Miami-Dade County", "Martin County"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "480 Hibiscus St, Suite 110",
    addressLocality: "West Palm Beach",
    addressRegion: "FL",
    postalCode: "33401",
    addressCountry: "US",
  },
  parentOrganization: { "@type": "Organization", name: "Modern Living Group at Compass" },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Masthead active="contact" />

      <div className="wrap">
        <p className="crumb" style={{ marginTop: 28 }}>
          <span>Contact</span>
        </p>

        <section className="contact-hero">
          <div className="contact-lede">
            <p className="eyebrow">Speak with us</p>
            <h1 className="serif">Let&rsquo;s find the one worth moving for.</h1>
            <p className="contact-sub">
              Whether it&rsquo;s a pre-construction allocation, a private developer preview, or a
              modern home on the water, we&rsquo;ll get you straight to the right person. We&rsquo;ve
              been on the sell side of South Florida&rsquo;s towers since 2008 — no call centers, no
              drip campaigns, no auto-dialers. Just a same-day reply.
            </p>

            <div className="contact-methods">
              <div className="contact-method">
                <p className="caps">Call or text</p>
                <a className="contact-big" href="tel:5612288420">561 228 8420</a>
              </div>
              <div className="contact-method">
                <p className="caps">Office</p>
                <p className="contact-addr">
                  480 Hibiscus St, Suite 110<br />
                  West Palm Beach, FL 33401
                </p>
              </div>
              <div className="contact-method">
                <p className="caps">Coverage</p>
                <p className="contact-addr">
                  Palm Beach &middot; Fort Lauderdale &middot; Miami &middot; the Treasure Coast
                </p>
              </div>
            </div>
          </div>

          <div className="contact-form-card">
            <p className="eyebrow" style={{ color: "rgba(255,255,255,.62)" }}>
              Send a note
            </p>
            <h2 className="serif contact-form-h">Tell us what you&rsquo;re after.</h2>
            <LeadForm source="contact-page" cta="Send it over" variant="dark" />
          </div>
        </section>

        <div style={{ height: 96 }} />
      </div>

      <Footer />
    </>
  );
}
