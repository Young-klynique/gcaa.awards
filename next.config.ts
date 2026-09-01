import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ['localhost', '172.20.10.3'] // allow local network access
  }
};

export default nextConfig;
