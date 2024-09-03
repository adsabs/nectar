import { FastifyHelmetOptions } from '@fastify/helmet';
import { Type as T } from '@fastify/type-provider-typebox';

export const TRACING_HEADERS = ['X-Original-Uri', 'X-Original-Forwarded-For', 'X-Forwarded-For', 'X-Amzn-Trace-Id'];

export const loadConfig = () => {
  const schema = T.Object({
    NODE_ENV: T.String({ enum: ['development', 'production', 'test'], default: 'production' }),
    COOKIE_SECRET: T.String(),
    SCIX_SESSION_COOKIE_NAME: T.String(),
    ADS_SESSION_COOKIE_NAME: T.String(),
    API_HOST_SERVER: T.String(),
    KEEP_ALIVE_TIMEOUT: T.Number({ default: 5000 }),
    REDIS_URL: T.String(),
    REDIS_KEY_PREFIX: T.String({ default: 'NECTAR/SERVER' }),
    PORT: T.Number({ default: 8000 }),
    CSRF_HEADER: T.String({ default: 'X-CSRFToken' }),
    API_BASE_DOMAIN_SERVER: T.String(),
    API_PREFIX: T.String({ default: '/v1' }),
  });

  const helmetConfig: FastifyHelmetOptions = {
    global: true,
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://cdn.jsdelivr.net',
          'https://www.google-analytics.com',
          'https://www.gstatic.com',
          'https://cdnjs.cloudflare.com',
          'https://www.googletagmanager.com',
          'https://www.google.com',
          'https://www.googleadservices.com',
          'https://www.googlesyndication.com',
        ],
        'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
        'base-uri': ["'self'"],
        'object-src': ["'none'"],
        'connect-src': [
          "'self'",
          'https://*.google-analytics.com',
          'https://*.adsabs.harvard.edu',
          'https://o1060269.ingest.us.sentry.io',
        ],
        'font-src': ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
        'frame-src': [
          'https://www.youtube-nocookie.com',
          'https://www.google.com',
          'https://www.google.com/recaptcha/',
        ],
        'form-action': ["'self'"],
        'img-src': [
          '*',
          'data:',
          'https://www.google.com',
          'https://www.gstatic.com',
          'https://i.ytimg.com',
          'https://s.ytimg.com',
        ],
        'manifest-src': ["'self'"],
        'media-src': ["'none'"],
        'worker-src': ["'self'", 'blob:'],
        'report-uri': [
          'https://o1060269.ingest.sentry.io/api/6049652/security/?sentry_key=e87ef8ec678b4ad5a2193c5463d386fd',
        ],
      },
      reportOnly: true,
    },
  };

  return {
    schema,
    helmetConfig,
  };
};
