import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    allowedDevOrigins: ["https://grew-salem-descriptions-measure.trycloudflare.com", "https://*.trycloudflare.com"]
  },
};

export default nextConfig;
