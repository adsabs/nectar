import withBundleAnalyzer from '@next/bundle-analyzer';
import { composePlugins } from '@nx/next';
import { withSentryConfig } from '@sentry/nextjs';
import nextBuildId from 'next-build-id';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',
  generateBuildId: async () =>
    nextBuildId({ dir: process.env.__dirname, describe: true }),
  generateEtags: true,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@nivo'],
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
    optimisticClientCache: false,
    esmExternals: 'loose',
    optimizePackageImports: [
      '@api',
      '@components',
      '@chakra-ui/react',
      'ramda',
    ],
  },
  async rewrites() {
    if (isDev) {
      return {
        beforeFiles: [
          {
            source: '/link_gateway/:path*',
            destination: `${process.env.BASE_CANONICAL_URL}/link_gateway/:path*`,
          },
        ],
      };
    }
    return {};
  },
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Strict-Transport-Security',
  //           value: 'max-age=63072000; includeSubDomains; preload',
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'SAMEORIGIN',
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'origin-when-cross-origin',
  //         },
  //         {
  //           key: 'X-XSS-Protection',
  //           value: '1; mode=block',
  //         },
  //         {
  //           key: 'Permissions-Policy',
  //           value:
  //             'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()',
  //         },
  //       ],
  //     },
  //   ];
  // },
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
    orcidRedirectUrl: process.env.ORCID_REDIRECT_URL,
    orcidClientId: process.env.ORCID_CLIENT_ID,
    orcidBaseUrl: process.env.ORCID_BASE_URL,
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
    emotion: true,
  }, // we do not need to check eslint during build
  eslint: { dirs: ['.'], ignoreDuringBuilds: true }, // we do not need to check types during build
  typescript: { ignoreBuildErrors: true }, // we don't need i18n
  i18n: null, // don't need to redirect on trailing slash
  skipTrailingSlashRedirect: true,
};

const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sentryOptions: {
    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true, // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true, // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: process.env.SENTRY_TUNNEL_ROUTE, // no source map comments
    hideSourceMaps: true, // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  },
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
};

export default composePlugins(
  withBundleAnalyzer({ enabled: !!process.env.ANALYZE }),
  (cfg) => () => withSentryConfig(cfg, sentryConfig),
)(nextConfig);
