const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
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
  future: {
    webpack5: true,
  },
});
