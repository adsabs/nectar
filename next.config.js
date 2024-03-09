const { withSentryConfig } = require('@sentry/nextjs');

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  distDir: process.env.DIST_DIR || 'dist',
  generateBuildId: async () => {
    return process.env.GIT_SHA ?? '';
  },
  generateEtags: true,
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
  async headers() {
    return [
      {
        source: '/:slug*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Feature-Policy',
            value:
              "geolocation 'none'; midi 'none'; microphone 'none'; camera 'none'; magnetometer 'none'; gyroscope 'none'; speaker 'none'; fullscreen 'self'; payment 'none'",
          },
        ],
      },
    ];
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

const sentryConfig = [
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

      // Suppresses source map uploading logs during build
      silent: true,
      org: 'adsabs',
      project: 'nectar',
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      transpileClientSDK: true,

      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
      tunnelRoute: '/monitor',

      // Hides source maps from generated client bundles
      hideSourceMaps: true,

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: false,
  },
];

if (process.env.NODE_ENV === 'production') {
  module.exports = withSentryConfig(config, ...sentryConfig);
} else {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  module.exports = withBundleAnalyzer(withSentryConfig(config, ...sentryConfig));
}
