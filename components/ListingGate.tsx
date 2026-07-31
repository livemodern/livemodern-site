'use client';

// ─── ListingGate — registration wall on listing detail pages ─────────
//
// Mirrors mlg-site's: counts unique listing views in localStorage and puts a
// BLOCKING AuthModal over the page once an anonymous visitor reaches the limit
// (site_settings.listing_view_limit:livemodern — currently 3). Signed-in users
// never see it.
//
// The `!loading` guard matters: while the session restores from localStorage
// `user` is briefly null, and without it a signed-in member past the limit gets
// the wall flashing on every listing.

import { useState } from 'react';
import { useUser } from '@/lib/auth';
import { useViewPaywall } from '@/lib/view-tracker';
import { AuthModal } from '@/components/AuthModal';

export default function ListingGate({
  mlsId,
  communitySlug = null,
  communityName = null,
}: {
  mlsId: string;
  communitySlug?: string | null;
  communityName?: string | null;
}) {
  const { user, loading } = useUser();
  const [unlocked, setUnlocked] = useState(false);
  const paywall = useViewPaywall({ isSignedIn: !!user, currentMlsId: mlsId });

  const open = !loading && !user && paywall.shouldShow && !unlocked;

  return (
    <AuthModal
      open={open}
      blocking
      defaultMode="signup"
      mlsId={mlsId}
      communitySlug={communitySlug}
      communityName={communityName}
      message={`You've viewed ${paywall.viewCount} ${paywall.viewCount === 1 ? 'residence' : 'residences'}. Create a free account to keep going — your saved homes and searches follow you across every Modern Living site.`}
      onClose={(result) => {
        if (result === 'signed-in') setUnlocked(true);
      }}
    />
  );
}
