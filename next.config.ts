import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from inferring a parent directory as the repo root
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "dgalywyr863hv.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
