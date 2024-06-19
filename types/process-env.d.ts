declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_ORCID_CLIENT_ID: string;
      NEXT_PUBLIC_ORCID_API_URL: string;
      NEXT_PUBLIC_ORCID_REDIRECT_URI: string;
      NEXT_PUBLIC_GTM_ID: string;
      NEXT_PUBLIC_RECAPTCHA_SITE_KEY: string;
      CSP_REPORT_URI: string;
      CSP_REPORT_ONLY: string;
      SENTRY_DSN: string;
      NEXT_PUBLIC_SENTRY_PROJECT_ID: string;
      SENTRY_AUTH_TOKEN: string;
      COOKIE_SECRET: string;
      ADS_SESSION_COOKIE_NAME: string;
      SCIX_SESSION_COOKIE_NAME: string;
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      MAILSLURP_API_KEY: string;
      REDIS_MAX_AGE: string;
      APP_LOG_LEVEL: string;

      [key: string]: string | undefined;
    }
  }
}

export {};
