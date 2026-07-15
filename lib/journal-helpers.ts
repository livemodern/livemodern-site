export * from "@/lib/journal";

/** Cloudflare image transform for journal images (R2-hosted). Mirrors cf() in
 *  communities.ts but local to the journal so it can be tuned independently. */
export function cfImg(url: string, w: number, q = 80): string {
  if (!url) return url;
  if (url.includes("images.livemodern.com") && !url.includes("/cdn-cgi/")) {
    return `https://images.livemodern.com/cdn-cgi/image/width=${w},quality=${q},format=auto/${url}`;
  }
  return url;
}
