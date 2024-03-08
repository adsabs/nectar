const { withSentryConfig } = require('@sentry/nextjs');

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  distDir: process.env.DIST_DIR || 'dist',
  generateBuildId: async () => {
    return process.env.GIT_SHA;
  },
  generateEtags: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { webVitalsAttribution: ['CLS', 'LCP'] },
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
    // for all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // suppresses source map uploading logs during build
    silent: true,
    org: 'adsabs',
    project: 'nectar',
  },
  {
    // for all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // upload a larger set of source maps for prettier stack traces (increases build time)
    widenclientfileupload: true,

    // transpiles sdk to be compatible with ie11 (increases bundle size)
    transpileclientsdk: true,

    // routes browser requests to sentry through a next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelroute: '/monitor',

    // hides source maps from generated client bundles
    hidesourcemaps: true,

    // automatically tree-shake sentry logger statements to reduce bundle size
    disablelogger: true,

    // enables automatic instrumentation of vercel cron monitors.
    // see the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticvercelmonitors: false,
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
