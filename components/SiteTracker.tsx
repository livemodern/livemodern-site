"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { attachUnloadFlush, captureAttribution, fire } from "@/lib/site-tracker";

/**
 * Mounted once from app/layout.tsx. Captures campaign attribution on landing,
 * fires a pageview on first load and on every client-side route change, and
 * flushes the queue when the tab is hidden or closed.
 */
export default function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
    return attachUnloadFlush();
  }, []);

  useEffect(() => {
    fire("pageview");
  }, [pathname]);

  return null;
}
