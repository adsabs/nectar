import nextBuildId from 'next-build-id';
import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://www.google-analytics.com https://www.gstatic.com https://cdnjs.cloudflare.com https://www.googletagmanager.com https://www.google.com https://www.googleadservices.com https://www.googlesyndication.com;
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
  base-uri 'self';
  object-src 'none';
  connect-src 'self' https://*.google-analytics.com https://*.adsabs.harvard.edu https://o1060269.ingest.sentry.io;
  font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com;
  frame-src https://www.youtube-nocookie.com https://www.google.com https://www.google.com/recaptcha/;
  form-action 'self';
  img-src * data: https://www.google.com https://www.gstatic.com https://i.ytimg.com https://s.ytimg.com;
  manifest-src 'self';
  media-src 'none';
  worker-src 'self' blob:;
  report-uri https://o1060269.ingest.sentry.io/api/6049652/security/?sentry_key=e87ef8ec678b4ad5a2193c5463d386fd;
`
  .replace(/\s{2,}/g, ' ')
  .trim();

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  distDir: process.env.DIST_DIR || 'dist',
  generateBuildId: async () => nextBuildId({ dir: process.env.__dirname, describe: true }),
  generateEtags: true,
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@nivo'],
  experimental: {
    esmExternals: 'loose',
    newNextLinkBehavior: false,
    webVitalsAttribution: ['CLS', 'LCP'],
    optimizePackageImports: ['@api', '@components', '@chakra-ui/react', 'ramda'],
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
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
  async headers() {
    return [
      {
        source: '/(.*)',
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: CSP,
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
  // set standalone output on
  output: process.env.STANDALONE ? 'standalone' : undefined,
  // we do not need to check eslint during build
  eslint: { dirs: ['src'], ignoreDuringBuilds: true },
  // we do not need to check types during build
  typescript: { ignoreBuildErrors: true },
  // we don't need i18n
  i18n: null,
  // don't need to redirect on trailing slash
  skipTrailingSlashRedirect: true,
};

/** @type {import('@sentry/cli').SentryCliOptions} */
const sentrySettings = {
  silent: true,
  org: 'adsabs',
  project: 'nectar',
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

/** @type {import('@sentry/nextjs/types/config/types').UserSentryOptions} */
const sentryConfig = {
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: '/api/monitor',
  // no source map comments
  hideSourceMaps: false,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
};

const config = process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;
const nextConfigWithSentry = withSentryConfig(config, sentrySettings, sentryConfig);

export default process.env.NODE_ENV === 'production' ? nextConfigWithSentry : config;
