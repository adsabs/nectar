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
    apiHost: process.env.API_HOST,
  },
};

module.exports = withBundleAnalyzer(config);
