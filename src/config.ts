import { SolrSort } from '@api';
import { IronSessionOptions } from 'iron-session';

export const APP_DEFAULTS = {
  DETAILS_MAX_AUTHORS: 50,
  RESULTS_MAX_AUTHORS: 10,
  RESULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [10, 25, 50, 100],
  SORT: ['date desc', 'bibcode desc'] as SolrSort[],
  QUERY_SORT_POSTFIX: 'bibcode desc' as SolrSort,
  EXPORT_PAGE_SIZE: 500,
  AUTHOR_AFF_SEARCH_SIZE: 100,
} as const;

export const GOOGLE_RECAPTCHA_KEY = '6Lex_aQUAAAAAMwJFbdGFeigshN7mRQdbXoGQ7-N';

export const sessionConfig: IronSessionOptions = {
  password: process.env.COOKIE_SECRET,
  cookieName: process.env.SCIX_SESSION_COOKIE_NAME,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export const ADMIN_ROUTE_PREFIXES = ['/user/libraries', '/user/settings'];
