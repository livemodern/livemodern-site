/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images are served + resized by Cloudflare (images.livemodern.com/cdn-cgi/image),
  // not the Next/Vercel optimizer — see lib/communities.ts cf(). No images config needed.
  async redirects() {
    return [
      // Modern Homes -> Collections (renamed section)
      { source: "/modern-homes", destination: "/collections", permanent: true },
    ];
  },
};
export default nextConfig;
