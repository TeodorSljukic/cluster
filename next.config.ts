import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Temporarily disabled reactCompiler for Hostinger compatibility
  // reactCompiler: true,
  // Increase body size limit for file uploads (default is 1MB)
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default nextConfig;
