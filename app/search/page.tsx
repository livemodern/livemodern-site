import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import SearchExperience from "@/components/SearchExperience";
import { SEARCH_CSS, SEARCH_MAP_CSS } from "./search-css";

export const metadata: Metadata = {
  title: "Search — LiveModern",
  description:
    "Search every home and condo for sale or rent across Palm Beach, Fort Lauderdale, Miami, and the Treasure Coast.",
  alternates: { canonical: "https://www.livemodern.com/search" },
};

// A locked, full-viewport search app (like modernlivingre.com): header + filter
// bar fixed at the top, the results list scrolls inside its own pane, the map is
// pinned. No page scroll, nothing above it to push it down — it's the whole view.
export default function SearchPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SEARCH_CSS + SEARCH_MAP_CSS }} />
      <div className="srch-app">
        <Masthead active="search" />
        <SearchExperience />
      </div>
    </>
  );
}
