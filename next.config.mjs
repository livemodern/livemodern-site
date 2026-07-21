/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images are served + resized by Cloudflare (images.livemodern.com/cdn-cgi/image),
  // not the Next/Vercel optimizer — see lib/communities.ts cf(). No images config needed.
  async redirects() {
    return [
      // Modern Homes -> Collections (renamed section)
      { source: "/modern-homes", destination: "/collections", permanent: true },
      // Retired thin Broward spokes -> the real market for that lifestyle
      { source: "/fort-lauderdale-beachfront-homes", destination: "/fort-lauderdale-beachfront-condos", permanent: true },
      { source: "/fort-lauderdale-golf-course-homes", destination: "/golf", permanent: true },
      { source: "/fort-lauderdale-equestrian-homes", destination: "/palm-beach-equestrian-homes", permanent: true },
    ];
  },
};
export default nextConfig;
