export * from "@/lib/journal";

/** Cloudflare image transform for journal images (R2-hosted). Mirrors cf() in
 *  communities.ts but local to the journal so it can be tuned independently. */
export function cfImg(url: string, w: number, q = 80): string {
  if (!url) return url;
  const m = url.match(/^https:\/\/(images\.(?:livemodern|mlrecloud)\.com)\/(?!cdn-cgi\/|img\/)(.+)$/);
  if (m) {
    // Static /img/ variant (persisted webp from R2) instead of per-month-billed /cdn-cgi/image.
    const snap = [640, 828, 1200, 1920].find((v) => w <= v) ?? 1920;
    return `https://${m[1]}/img/${snap}/${m[2]}`;
  }
  return url;
}
