import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/snarkjs/**',
      './node_modules/r1csfile/**',
      './node_modules/@iden3/binfileutils/**',
      './node_modules/ffjavascript/**',
      './node_modules/fastfile/**',
      './node_modules/circom_runtime/**',
    ],
  },
};

export default nextConfig;
