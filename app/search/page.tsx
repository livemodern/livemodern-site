import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import SearchExperience from "@/components/SearchExperience";
import { SEARCH_CSS, SEARCH_MAP_CSS } from "./search-css";

export const metadata: Metadata = {
  title: "Search — LiveModern",
  description:
    "Search every home and condo for sale or rent across Palm Beach, Fort Lauderdale, Miami, and the Treasure Coast.",
  alternates: { canonical: "https://www.livemodern.com/search" },
};

// The full county-wide search. Lifestyle collections stay the front door; this
// is the raw, complete search underneath — so saved searches (LiveModern's own
// and imported MLG ones) can run natively here.
export default function SearchPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SEARCH_CSS + SEARCH_MAP_CSS }} />
      <Masthead active="search" />
      <div className="srch-top wrap">
        <p className="eyebrow">Search</p>
        <h1 className="serif srch-h1">Every listing, one place.</h1>
        <p className="srch-lede">
          The full market — Palm Beach to Miami and up the Treasure Coast. Filter it, map it, save
          it. Curated collections are the front door; this is everything behind it.
        </p>
      </div>
      <SearchExperience />
      <div style={{ height: 72 }} />
      <Footer />
    </>
  );
}
