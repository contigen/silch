import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/@iden3/bigarray/**',
      './node_modules/@iden3/binfileutils/**',
      './node_modules/@noble/hashes/**',
      './node_modules/async/**',
      './node_modules/balanced-match/**',
      './node_modules/bfj/**',
      './node_modules/bluebird/**',
      './node_modules/brace-expansion/**',
      './node_modules/check-types/**',
      './node_modules/circom_runtime/**',
      './node_modules/deep-is/**',
      './node_modules/ejs/**',
      './node_modules/escodegen/**',
      './node_modules/esprima/**',
      './node_modules/estraverse/**',
      './node_modules/esutils/**',
      './node_modules/fast-levenshtein/**',
      './node_modules/fastfile/**',
      './node_modules/ffjavascript/**',
      './node_modules/filelist/**',
      './node_modules/hoopy/**',
      './node_modules/jake/**',
      './node_modules/jsonpath/**',
      './node_modules/levn/**',
      './node_modules/logplease/**',
      './node_modules/minimatch/**',
      './node_modules/optionator/**',
      './node_modules/picocolors/**',
      './node_modules/prelude-ls/**',
      './node_modules/r1csfile/**',
      './node_modules/snarkjs/**',
      './node_modules/static-eval/**',
      './node_modules/tryer/**',
      './node_modules/type-check/**',
      './node_modules/underscore/**',
      './node_modules/wasmbuilder/**',
      './node_modules/wasmcurves/**',
      './node_modules/web-worker/**',
      './node_modules/word-wrap/**',
    ],
  },
};

export default nextConfig;
