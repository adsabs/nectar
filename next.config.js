const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  distDir: process.env.DIST_DIR || 'dist',
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/abs/:id',
        destination: '/abs/:id/abstract',
        permanent: true,
      },
    ];
  },
  publicRuntimeConfig: {
    apiHost: process.env.API_HOST_CLIENT,
  },
  serverRuntimeConfig: {
    apiHost: process.env.API_HOST_SERVER,
    baseCanonicalUrl: process.env.BASE_CANONICAL_URL,
  },
  images: {
    domains: ['s3.amazonaws.com'],
  },
  webpack: (config) => {
    config.module.rules = [
      ...config.module.rules,
      {
        test: /src\/.*\/index.ts/i,
        sideEffects: false,
      },
    ];
    return config;
  },
};

module.exports = withBundleAnalyzer(config);
