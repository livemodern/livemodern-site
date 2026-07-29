"use client";

import { useEffect } from "react";
import { fire } from "@/lib/site-tracker";

/**
 * Fires a listing_view carrying the real mls_id. This is the gap the fleet's
 * anonymous pixel.js never closed — it sent pageviews only, with email
 * hardcoded to null, so property views never attached to a CRM contact. Here
 * the tracker's identity cookie rides along and /api/track resolves contact_id,
 * so what a lead browses shows on their timeline.
 */
export default function TrackListingView({
  mlsId,
  communitySlug,
  price,
  city,
}: {
  mlsId: string;
  communitySlug?: string | null;
  price?: number | null;
  city?: string | null;
}) {
  useEffect(() => {
    fire("listing_view", {
      data: {
        mls_id: mlsId,
        community_slug: communitySlug ?? null,
        list_price: price ?? null,
        city: city ?? null,
      },
    });
  }, [mlsId, communitySlug, price, city]);

  return null;
}
