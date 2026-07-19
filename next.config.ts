import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Temporary remote imagery for the preview build. All image URLs are
    // centralised in src/lib/properties.ts and src/lib/content.ts so they can
    // be swapped for locally-hosted approved assets without touching components.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
