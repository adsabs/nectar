import { FastifyHelmetOptions } from '@fastify/helmet';
import S from 'fluent-json-schema';

export const loadConfig = () => {
  const schema = S.object()
    .prop('NODE_ENV', S.string().enum(['development', 'production', 'testing']).required().default('production'))
    .prop('COOKIE_SECRET', S.string().required())
    .prop('SCIX_SESSION_COOKIE_NAME', S.string().required())
    .prop('ADS_SESSION_COOKIE_NAME', S.string().required())
    .prop('API_HOST_SERVER', S.string().required())
    .prop('KEEP_ALIVE_TIMEOUT', S.number().required().default(5000))
    .prop('REDIS_HOST', S.string().required())
    .prop('REDIS_PORT', S.number().required())
    .prop('PORT', S.number().required().default(8000))
    .valueOf();

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
          'https://o1060269.ingest.sentry.io',
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
