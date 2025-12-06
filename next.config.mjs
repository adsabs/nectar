import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import nextBuildId from 'next-build-id';

const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://recaptcha.google.com https://www.recaptcha.net https://recaptcha.net https://www.googleadservices.com https://www.googlesyndication.com https://www.gstatic.com https://www.gstatic.cn;
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com;
  base-uri 'self';
  object-src 'none';
  connect-src 'self' https://*.google-analytics.com https://*.adsabs.harvard.edu https://o1060269.ingest.sentry.io https://scixplorer.org https://*.scixplorer.org https://www.googletagmanager.com https://www.google.com https://recaptcha.google.com https://www.recaptcha.net https://recaptcha.net https://www.gstatic.com https://www.gstatic.cn https://*.googleapis.com https://*.clients6.google.com;
  font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com;
  frame-src https://www.youtube-nocookie.com https://www.google.com https://www.google.com/recaptcha/ https://recaptcha.google.com https://www.recaptcha.net https://recaptcha.net;
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
  transpilePackages: ['@nivo/core', '@nivo/line', '@nivo/bar'],
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
          // rewrites for link_gateway
          {
            source: '/link_gateway/:path*',
            destination: `${process.env.BASE_CANONICAL_URL}/link_gateway/:path*`,
          },

          // rewrites for API calls to the server
          {
            source: '/v1/:path*',
            destination: `${process.env.API_HOST_CLIENT}/:path*`,
          },
        ],
      };
    }
    return {};
  },
  async headers() {
    return [
      {
        source: '/onboard',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
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
              'accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), xr-spatial-tracking=()',
          },
          {
            key: 'Content-Security-Policy',
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
  devIndicators: {
    position: 'bottom-right',
  },
};

/** @type {import('@sentry/cli').SentryCliOptions} */
const sentrySettings = {
  silent: true,
  org: 'adsabs',
  project: 'nectar',
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  environment: process.env.NODE_ENV || 'development',
};

/** @type {import('@sentry/nextjs/types/config/types').UserSentryOptions} */
const sentryConfig = {
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,
  // no source map comments
  hideSourceMaps: false,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  reactComponentAnnotation: { enabled: true },
};

const config = process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;
const nextConfigWithSentry = withSentryConfig(config, sentrySettings, sentryConfig);

// don't include sentry config in testing or CI environments
const finalConfig = ['production', 'development'].includes(process.env.NODE_ENV) ? nextConfigWithSentry : config;
export default finalConfig;
