declare namespace NodeJS {
  export interface ProcessEnv extends ProcessEnv {
    API_BASE_DOMAIN_CLIENT: string;
    API_BASE_DOMAIN_SERVER: string;
    BASE_CANONICAL_URL: string;
    API_HOST_SERVER: string;
    NEXT_PUBLIC_API_HOST_CLIENT: string;
    COOKIE_SECRET: string;
    ADS_SESSION_COOKIE_NAME: string;
    SCIX_SESSION_COOKIE_NAME: string;
    NEXT_PUBLIC_ORCID_CLIENT_ID: string;
    NEXT_PUBLIC_ORCID_API_URL: string;
    NEXT_PUBLIC_ORCID_REDIRECT_URI: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD?: string; // Optional since the value might be empty
    REDIS_MAX_AGE: string;
    NEXT_PUBLIC_SEARCH_API_TIMEOUT_MS: string;
    NEXT_PUBLIC_SEARCH_SSR_API_TIMEOUT_MS: string;
    VERIFIED_BOTS_ACCESS_TOKEN?: string; // Optional since the value might be empty
    UNVERIFIABLE_BOTS_ACCESS_TOKEN?: string; // Optional since the value might be empty
    MALICIOUS_BOTS_ACCESS_TOKEN?: string; // Optional since the value might be empty
    NEXT_PUBLIC_GTM_ID: string;
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: string;
    MAILSLURP_API_KEY: string;
    CSP_REPORT_URI: string;
    CSP_REPORT_ONLY: string;
    NEXT_PUBLIC_SENTRY_DSN: string;
    NEXT_PUBLIC_SENTRY_PROJECT_ID: string;
    SENTRY_AUTH_TOKEN: string;
    APP_LOG_LEVEL: string;

    [key: string]: string | undefined;
  }
}
