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
      './node_modules/@iden3/**',
      './node_modules/ffjavascript/**',
      './node_modules/fastfile/**',
      './node_modules/circom_runtime/**',
      './node_modules/wasmcurves/**',
      './node_modules/wasmbuilder/**',
      './node_modules/web-worker/**',
      './node_modules/bfj/**',
      './node_modules/logplease/**',
      './node_modules/@noble/**',
      './node_modules/ejs/**',
    ],
  },
};

export default nextConfig;
