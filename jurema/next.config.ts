import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  devIndicators: false,
  basePath,
};

export default nextConfig;
