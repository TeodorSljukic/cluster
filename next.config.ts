import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Fix for chunk loading errors on Hostinger
  output: "standalone",
  // Disable static optimization for better compatibility
  experimental: {
    // Improve chunk loading
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
