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
  experimental: { newNextLinkBehavior: false, webVitalsAttribution: ['CLS', 'LCP'] },
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return {
        beforeFiles: [
          { source: '/link_gateway/:path*', destination: `${process.env.BASE_CANONICAL_URL}/link_gateway/:path*` },
        ],
      };
    }
    return {};
  },
  async redirects() {
    return [
      // redirect bare abs links to /abstract by default
      {
        source: '/abs/:id',
        destination: '/abs/:id/abstract',
        permanent: true,
      },

      // redirect base export routes to bibtex by default
      {
        source: '/abs/:id/exportcitation',
        destination: '/abs/:id/exportcitation/bibtex',
        permanent: true,
      },
      {
        source: '/search/exportcitation',
        destination: '/search/exportcitation/bibtex',
        permanent: true,
      },

      {
        source: '/user/settings',
        destination: '/user/settings/application',
        permanent: true,
      },
      {
        has: [
          {
            type: 'host',
            key: 'page',
            value: 'localhost',
          },
        ],
        source: '/help/:slug*',
        destination: 'http://adsabs.github.io/help/:slug*',
        permanent: false,
        basePath: false,
      },
      {
        has: [
          {
            type: 'host',
            key: 'page',
            value: 'localhost',
          },
        ],
        source: '/scixhelp/:slug*',
        destination: 'http://adsabs.github.io/scixhelp/:slug*',
        permanent: false,
        basePath: false,
      },
    ];
  },
  trailingSlash: false,
  publicRuntimeConfig: {
    apiHost: process.env.API_HOST_CLIENT,
    experiments: process.env.NEXT_PUBLIC_ENABLE_EXPERIMENTS?.split(',') || [],
  },
  serverRuntimeConfig: {
    apiHost: process.env.API_HOST_SERVER,
    baseCanonicalUrl: process.env.BASE_CANONICAL_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compiler: {
    reactRemoveProperties: false,
  },
  output: 'standalone',
  // Don't bother linting during CI builds
  ...(!process.env.CI ? {} : { eslint: { ignoreDuringBuilds: true } }),
};

module.exports = withBundleAnalyzer(config);
