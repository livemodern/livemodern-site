import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site-url";
import { LEGAL_CSS } from "./legal-css";

// Adapted from mlg-site's carrier-compliant privacy policy (which cleared
// Twilio A2P) for the LiveModern brand. Entity structure matters here and is
// stated plainly throughout: LiveModern is a consumer-facing WEBSITE BRAND —
// not a legal entity, not an LLC, not a brokerage. The operating entity is
// Modern Living Real Estate LLC d/b/a Modern Living Group, a Florida-licensed
// real-estate team at Compass. For any purpose connected to facilitating real
// estate, the responsible party is "Modern Living Group at Compass."
//
// Deliberately noindex: legal boilerplate has no search value and would only
// dilute crawl budget, same as mlg-site.

export const metadata: Metadata = {
  title: "Privacy Policy | LiveModern",
  description:
    "How LiveModern and Modern Living Group at Compass collect, use, and protect your personal information, including SMS messaging practices and your opt-out rights.",
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  robots: { index: false, follow: true },
};

const EFFECTIVE = "July 29, 2026";

export default function PrivacyPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEGAL_CSS }} />
      <Masthead />
      <div className="wrap">
        <section className="legal-intro">
          <p className="eyebrow">Legal</p>
          <h1 className="serif">
            Privacy <em>Policy</em>
          </h1>
          <p className="legal-eff">Effective: {EFFECTIVE}</p>
        </section>

        <div className="legal-prose">
          <p>
            LiveModern is a consumer-facing website brand operated by Modern Living Real Estate LLC,
            doing business as Modern Living Group — a Florida-licensed real-estate team at Compass
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). LiveModern is a brand and website
            only; it is not a separate legal entity, corporation, or brokerage. For all purposes
            connected to facilitating a real-estate transaction, the responsible party is{" "}
            <strong>Modern Living Group at Compass</strong>. This Privacy Policy describes how we
            collect, use, share, and protect personal information about our clients, prospects, and
            visitors to livemodern.com.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect personal information you provide directly to us — when you submit an inquiry
            or request a call on this site, register for an account, ask about a specific residence
            or pre-construction allocation, engage one of our licensed agents, sign a buyer&rsquo;s
            broker, listing, or lease agreement, attend a showing or developer preview, or otherwise
            communicate with us. This includes:
          </p>
          <ul>
            <li>
              <strong>Identity information:</strong> full name, mailing address, and date of birth
              when required for transaction documentation.
            </li>
            <li>
              <strong>Contact information:</strong> email address, mobile and home phone numbers.
            </li>
            <li>
              <strong>Preference information:</strong> the buildings, price ranges, lifestyles, and
              markets you tell us you are interested in.
            </li>
            <li>
              <strong>Transaction information:</strong> properties you have bought, sold, or leased
              through us; offers, contracts, deposits, and closing details.
            </li>
            <li>
              <strong>Financial information</strong> limited to what is required to facilitate a
              real-estate transaction — for example proof-of-funds documentation or a mortgage
              pre-approval reference, and any developer-required qualification for a
              pre-construction reservation.
            </li>
            <li>
              <strong>Communications:</strong> notes, messages, and call logs between you and your
              assigned agent, including conversations with our on-site assistant.
            </li>
          </ul>
          <p>
            We also collect limited information automatically when you visit livemodern.com: server
            logs (IP address, user-agent, pages and listings viewed), first-party analytics events,
            and authentication cookies if you are logged in. Where we use third-party measurement
            tags, they are described in Section 6.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>
              Provide licensed real-estate brokerage services, including representing you in the
              purchase, sale, or lease of property.
            </li>
            <li>
              Route your inquiry to the right licensed agent on our team and follow up about active
              and prospective transactions by phone, SMS, email, or postal mail.
            </li>
            <li>
              Introduce and, where you ask us to, register you with a developer or its sales gallery
              for a new-construction or pre-construction residence.
            </li>
            <li>Prepare, deliver, and execute real-estate contracts and related documents.</li>
            <li>
              Comply with Florida and federal laws applicable to licensed real-estate brokerages,
              including record-retention requirements.
            </li>
            <li>Improve the site and understand which content and listings are useful.</li>
          </ul>

          <h2>3. SMS / Text Messaging</h2>
          <p>
            When you provide your mobile phone number — through a form on this site (account
            registration, inquiry, showing or call request, or a per-listing question), in writing on
            a signed agency or listing agreement, or verbally during a consultation — you consent to
            receive SMS messages from your assigned agent and from Modern Living Group&rsquo;s broker
            about your active or prospective real-estate transaction. These are one-to-one
            conversational communications — not bulk marketing.
          </p>
          <p>
            <strong>Message frequency</strong> varies based on the pace of your transaction and your
            conversation with your agent. <strong>Msg &amp; data rates may apply</strong> — consult
            your mobile carrier&rsquo;s pricing.
          </p>
          <p>
            <strong>Opt out at any time</strong> by replying <strong>STOP</strong> to any text
            message we send you. You will receive a confirmation that you have been unsubscribed,
            after which we will send no further SMS messages from our system. Reply{" "}
            <strong>HELP</strong> to any message for assistance and your agent&rsquo;s contact
            information.
          </p>
          <p>
            We <strong>do not</strong> share your phone number with third parties for marketing
            purposes. We <strong>do not</strong> sell phone numbers under any circumstance.
          </p>
          <p>
            <strong>
              No mobile information will be shared with third parties or affiliates for marketing or
              promotional purposes.
            </strong>{" "}
            Information sharing to subcontractors in support services, such as customer service or
            transaction coordination, is permitted only to the extent necessary to fulfill our
            services to you. SMS opt-in consent and phone numbers collected for the purpose of SMS
            communications are not shared with any third party.
          </p>

          <h2>4. When We Share Your Information</h2>
          <p>
            To complete a real-estate transaction we are representing you on, we share information
            only with parties necessary for that transaction:
          </p>
          <ul>
            <li>
              Compass, as the brokerage under which Modern Living Group is licensed and through which
              transactions are processed.
            </li>
            <li>
              The counterparty&rsquo;s broker and agent — for example the listing broker on a
              property you are buying, or the buyer&rsquo;s broker on a property you are listing.
            </li>
            <li>
              A developer or its sales gallery, when you ask us to register you for a
              new-construction or pre-construction residence. We share only what that registration
              requires, and only at your direction.
            </li>
            <li>Title insurance companies and closing agents handling your closing.</li>
            <li>Lenders, mortgage brokers, and appraisers if you authorize us to coordinate with them.</li>
            <li>
              Homeowners&rsquo; and condominium associations when their approval is required for a
              transaction.
            </li>
            <li>Property inspectors, surveyors, and other licensed professionals you engage.</li>
            <li>
              Service providers who help us operate our business — cloud hosting, secure document
              storage, customer-relationship and transaction-management software, email and SMS
              delivery — who are bound by confidentiality obligations.
            </li>
            <li>Government authorities when required by law, such as 1099-S reporting on sales.</li>
          </ul>
          <p>
            We <strong>do not</strong> share your information with third parties for their own
            marketing purposes, and we do not sell personal information.
          </p>

          <h2>5. Cookies &amp; Site Analytics</h2>
          <p>
            We use first-party cookies to keep you signed in, remember your saved listings and
            searches, and attribute which page or campaign brought you to the site. We also use
            first-party analytics that record page and listing views so we can understand what
            visitors find useful. Where third-party measurement or advertising tags are active, they
            may set their own cookies subject to their providers&rsquo; policies. You can block or
            delete cookies in your browser; some site features — including saved listings and staying
            signed in — will not work without them.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain transaction records, including communications, contracts, and disclosures, for
            the period required by Florida real-estate brokerage record-keeping rules — currently
            five (5) years from the close of the transaction, per Florida Real Estate Commission
            regulations. Records under active litigation or audit are retained for the duration of
            those proceedings. Inactive prospect records are retained for up to three (3) years
            unless you request earlier deletion.
          </p>

          <h2>7. Security</h2>
          <p>
            We protect your information using reasonable administrative, technical, and physical
            safeguards, including encrypted data storage, access controls limiting visibility to the
            agents and staff working on your matter, and secure cloud infrastructure. No method of
            electronic transmission or storage is 100% secure; we cannot guarantee absolute security.
          </p>

          <h2>8. Your Rights</h2>
          <p>You may, at any time:</p>
          <ul>
            <li>Request access to the personal information we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>
              Request deletion of your information, subject to our legal record-retention
              obligations.
            </li>
            <li>
              Opt out of SMS by replying <strong>STOP</strong>, or of email by following the
              unsubscribe link in any email.
            </li>
            <li>
              Withdraw consent for ongoing communications by contacting your agent or the address
              below.
            </li>
          </ul>

          <h2>9. Children</h2>
          <p>
            Our services are not directed to children under 18. We do not knowingly collect personal
            information from children. If you believe a child has provided us with information,
            contact us and we will delete it.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &ldquo;Effective&rdquo; date at
            the top reflects the most recent revision. For material changes, we will provide notice
            through this site or directly to active clients.
          </p>

          <h2>11. Contact Us</h2>
          <p>Questions about this Privacy Policy or your information:</p>
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
            services are provided by Modern Living Group at Compass.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
