/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.sellmodernhomes.com" },
      { protocol: "https", hostname: "images.mlrecloud.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 750, 960, 1080, 1200, 1600, 1920],
  },
};
export default nextConfig;
