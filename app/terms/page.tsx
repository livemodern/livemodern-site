import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site-url";
import { LEGAL_CSS } from "../privacy-policy/legal-css";

// Adapted from mlg-site's terms for the LiveModern brand. Same entity
// structure as the privacy policy: LiveModern is a website brand, the operating
// entity is Modern Living Real Estate LLC d/b/a Modern Living Group, and the
// licensed brokerage is Compass. noindex, like mlg-site.

export const metadata: Metadata = {
  title: "Terms of Use | LiveModern",
  description:
    "Terms governing your use of the LiveModern website, our services, and our SMS program.",
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: false, follow: true },
};

const EFFECTIVE = "July 29, 2026";

export default function TermsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEGAL_CSS }} />
      <Masthead />
      <div className="wrap">
        <section className="legal-intro">
          <p className="eyebrow">Legal</p>
          <h1 className="serif">
            Terms of <em>Use</em>
          </h1>
          <p className="legal-eff">Effective: {EFFECTIVE}</p>
        </section>

        <div className="legal-prose">
          <p>
            These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of livemodern.com.
            LiveModern is a consumer-facing website brand operated by Modern Living Real Estate LLC,
            doing business as Modern Living Group — a Florida-licensed real-estate team at Compass
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). LiveModern is a brand and website
            only; it is not a separate legal entity, corporation, or brokerage. All real-estate
            services referenced on this site are provided by{" "}
            <strong>Modern Living Group at Compass</strong>. By using this site or any of our
            services, you agree to these Terms.
          </p>

          <h2>1. Real-Estate Brokerage Services</h2>
          <p>
            Modern Living Group at Compass provides licensed real-estate brokerage services in
            Florida. Listing data on this site is provided by BeachesMLS and its participating
            brokers. Listing information is believed to be accurate but is not guaranteed. Always
            confirm material details with your assigned agent before acting on them, including price,
            status, square footage, taxes, association fees, school assignments, and any other facts
            you consider material.
          </p>

          <h2>2. New Construction &amp; Pre-Construction</h2>
          <p>
            Information about new-construction and pre-construction developments — including pricing,
            unit mixes, floor plans, amenities, renderings, and delivery dates — originates with the
            developer and is subject to change without notice. Renderings are artists&rsquo;
            conceptions and may differ from what is built. Nothing on this site is an offer to sell,
            or a solicitation of an offer to buy, where prohibited by law; any purchase is governed
            solely by the developer&rsquo;s own purchase agreement and required disclosures. We do not
            control developer deposit structures, reservation terms, or delivery schedules.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            Some features — saving listings, saving searches, and requesting showings or private
            previews — require an account. You are responsible for maintaining the confidentiality of
            your credentials and for all activity under your account. You agree to provide accurate
            information at registration and to keep it current.
          </p>

          <h2>4. SMS Program Terms</h2>
          <p>
            When you provide a mobile phone number — through a form on this site (account
            registration, inquiry, showing or call request, per-listing question), in a signed agency
            or listing agreement, or verbally to your assigned agent — you consent to receive SMS
            messages from that agent and from Modern Living Group&rsquo;s broker about your active or
            prospective real-estate transaction.
          </p>
          <ul>
            <li>
              <strong>Sender:</strong> Modern Living Group at Compass, and your assigned licensed
              agent by name.
            </li>
            <li>
              <strong>Purpose:</strong> One-to-one transactional communication about a buyer, seller,
              or rental matter you are working on with us. We do not send bulk marketing or automated
              drip campaigns through our SMS program.
            </li>
            <li>
              <strong>Message frequency</strong> varies based on the pace of your transaction and your
              conversation with your agent.
            </li>
            <li>
              <strong>Carrier charges:</strong> Msg &amp; data rates may apply. Consult your mobile
              carrier&rsquo;s pricing.
            </li>
            <li>
              <strong>Opt out:</strong> Reply <strong>STOP</strong> to any message at any time. You
              will receive a confirmation that you have been unsubscribed; no further messages will be
              sent from our system to that number.
            </li>
            <li>
              <strong>Help:</strong> Reply <strong>HELP</strong> to any message to receive your
              agent&rsquo;s contact information and opt-out instructions.
            </li>
          </ul>
          <p>
            Our handling of mobile phone numbers and SMS content is further described in our{" "}
            <a href="/privacy-policy">Privacy Policy</a>.
          </p>

          <h2>5. Listing Data &amp; BeachesMLS Attribution</h2>
          <p>
            IDX information is provided exclusively for consumers&rsquo; personal, non-commercial use,
            may not be used for any purpose other than to identify prospective properties consumers
            may be interested in purchasing, and is deemed reliable but is not guaranteed accurate by
            the MLS. All listings featuring the BeachesMLS logo are provided by BeachesMLS, Inc.
          </p>

          <h2>6. Our On-Site Assistant</h2>
          <p>
            This site offers an AI assistant that can answer questions about buildings, inventory, and
            neighborhoods. Its responses are generated automatically, are informational only, and are
            not advice, an offer, a representation, or a substitute for speaking with a licensed
            agent. It can be wrong or out of date. Verify anything material with your assigned agent
            before relying on it. Conversations may be recorded and reviewed so we can follow up and
            improve the service, as described in our{" "}
            <a href="/privacy-policy">Privacy Policy</a>.
          </p>

          <h2>7. No Financial, Legal, or Investment Advice</h2>
          <p>
            Content on this site, including market statistics and any analysis or opinion, is for
            general informational purposes only and is not financial, investment, legal, or tax
            advice. Consult appropriate licensed professionals before making any real-estate,
            financial, or legal decision.
          </p>

          <h2>8. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Scrape, copy, or republish listing data in violation of BeachesMLS or applicable IDX rules.</li>
            <li>
              Attempt to circumvent or interfere with site security, authentication, or rate-limiting
              controls.
            </li>
            <li>
              Submit false or misleading information through any form on this site, including showing
              requests, account registration, or inquiries.
            </li>
            <li>
              Use any automated system to access or interact with the site, including the assistant,
              without our express written permission.
            </li>
          </ul>

          <h2>9. Intellectual Property</h2>
          <p>
            The LiveModern and Modern Living Group names, logos, branding, and original site content —
            text, commissioned photography, and design elements — are owned by Modern Living Real
            Estate LLC. Third-party content, including listing photos sourced from BeachesMLS and
            developer renderings, remains the property of its respective owners. You may not reproduce
            or redistribute any of it without written permission.
          </p>

          <h2>10. Disclaimer &amp; Limitation of Liability</h2>
          <p>
            The site is provided &ldquo;as is&rdquo; without warranty of any kind. We do not warrant
            that the site will be uninterrupted, secure, or error-free; that defects will be
            corrected; or that any information available through the site is accurate or complete. To
            the maximum extent permitted by law, Modern Living Real Estate LLC, Modern Living Group,
            and Compass are not liable for any indirect, incidental, special, consequential, or
            punitive damages arising out of your use of the site.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Florida, without regard to
            conflict-of-law principles. Any dispute arising out of or related to these Terms or your
            use of the site will be brought exclusively in the state or federal courts located in
            Palm Beach County, Florida.
          </p>

          <h2>12. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. The &ldquo;Effective&rdquo; date at the top
            reflects the most recent revision. Continued use of the site after a change indicates your
            acceptance of the updated Terms.
          </p>

          <h2>13. Contact</h2>
          <p>Questions about these Terms:</p>
          <p className="legal-addr">
            Modern Living Group at Compass
            <br />
            480 Hibiscus Street, Suite 110
            <br />
            West Palm Beach, FL 33401
            <br />
            (561) 228-8420
            <br />
            <a href="mailto:info@modernlivingre.com">info@modernlivingre.com</a>
          </p>
          <p className="legal-note">
            LiveModern is a website brand of Modern Living Real Estate LLC d/b/a Modern Living Group,
            a licensed real-estate team at Compass. Compass is the licensed brokerage. All real-estate
            services are provided by Modern Living Group at Compass. Equal Housing Opportunity.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
