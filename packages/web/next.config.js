const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withPlugins([
  [
    withBundleAnalyzer,
    {
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
    },
  ],
  [withTM, { transpileModules: ['api', 'components', 'context'] }],
]);

withBundleAnalyzer();
