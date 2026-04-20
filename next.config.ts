import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@paper-design/shaders-react'],
  },
};

export default nextConfig;