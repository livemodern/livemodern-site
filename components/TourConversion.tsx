"use client";

// The listing page's "Request info" tour form is a plain server-rendered
// <form action="/api/leads" method="post"> — a full-page navigation, so
// there's no client submit handler to fire the Ads conversion from. This
// component attaches one. gtag conversions ride sendBeacon, which survives
// the unload. Rendered once from app/listing/[mls]/page.tsx.

import { useEffect } from "react";
import { trackConversion, ConversionLabel } from "@/lib/google-ads-conversions";

export default function TourConversion() {
  useEffect(() => {
    const form = document.getElementById("tour");
    if (!form) return;
    const onSubmit = () => trackConversion(ConversionLabel.RequestAShowing);
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);
  return null;
}
