import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail build on ESLint errors - this is critical for Railway deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors (you can set this to false if you want strict checking)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
