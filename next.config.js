const { withSentryConfig } = require('@sentry/nextjs');
const nextBuildId = require('next-build-id');

const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  base-uri 'self';
  object-src 'none';
  connect-src 'self' https://*.google-analytics.com https://*.adsabs.harvard.edu;
  font-src 'self' https://cdnjs.cloudflare.com;
  frame-src https://www.youtube-nocookie.com https://www.google.com;
  form-action 'self';
  img-src * data:;
  manifest-src 'self';
  media-src 'none';
  worker-src 'self' blob:;
  report-uri https://o1060269.ingest.sentry.io/api/6049652/security/?sentry_key=e87ef8ec678b4ad5a2193c5463d386fd
`;

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  distDir: process.env.DIST_DIR || 'dist',
  generateBuildId: async () => nextBuildId({ dir: __dirname, describe: true }),
  generateEtags: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    newNextLinkBehavior: false,
    webVitalsAttribution: ['CLS', 'LCP'],
    optimisticClientCache: false,
    optimizePackageImports: ['@api', '@components', '@chakra-ui/react', 'ramda'],
  },
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
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: CSP.replace(/\n/g, ''),
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
    tunnelRoute: '/api/monitor',

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
