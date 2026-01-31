import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  outputFileTracingIncludes: {
    '/api/**': ['node_modules/snarkjs/**/*'],
  },
};

export default nextConfig;
