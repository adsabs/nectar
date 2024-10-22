import { IronSessionOptions } from 'iron-session';
import { SolrSort } from '@/api/models';

export const APP_DEFAULTS = {
  DETAILS_MAX_AUTHORS: 50,
  RESULTS_MAX_AUTHORS: 10,
  RESULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [10, 25, 50, 100],
  SORT: ['score desc', 'date desc'] as SolrSort[],
  QUERY_SORT_POSTFIX: 'date desc' as SolrSort,
  EXPORT_PAGE_SIZE: 500,
  AUTHOR_AFF_SEARCH_SIZE: 100,
  MIN_AUTHORCUTOFF: 1,
  MAX_AUTHORCUTOFF: 500,
  MIN_EXPORT_AUTHORS: 1,
  MAX_EXPORT_AUTHORS: 500,
  BIBTEX_DEFAULT_MAX_AUTHOR: 10,
  BIBTEX_ABS_DEFAULT_MAX_AUTHOR: 10,
  BIBTEX_DEFAULT_AUTHOR_CUTOFF: 10,
  RESULT_ITEM_PUB_CUTOFF: 50,
  EMPTY_QUERY: '*:*',
  API_TIMEOUT: 30000,
  SSR_API_TIMEOUT: 30000,
  PREFERRED_SEARCH_SORT: 'score',
} as const;

export const GOOGLE_RECAPTCHA_KEY = '6Lex_aQUAAAAAMwJFbdGFeigshN7mRQdbXoGQ7-N';

export const sessionConfig: IronSessionOptions = {
  password: process.env.COOKIE_SECRET,
  cookieName: process.env.SCIX_SESSION_COOKIE_NAME,
  // secure: true should be used in production () but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
};

// Route prefixes that require authentication
export const PROTECTED_ROUTES = ['/user/libraries', '/user/settings'];

// Route prefixes that are not accessible when authenticated
export const AUTH_EXCEPTIONS = ['/user/account'];

const search = new URLSearchParams({
  client_id: process.env.NEXT_PUBLIC_ORCID_CLIENT_ID,
  response_type: 'code',
  access_type: 'offline',
  scope: '/orcid-profile/read-limited /orcid-works/create /orcid-works/update',
  redirect_uri: process.env.NEXT_PUBLIC_ORCID_REDIRECT_URI,
});
export const ORCID_LOGIN_URL = `${process.env.NEXT_PUBLIC_ORCID_API_URL}/oauth/authorize?${search.toString()}`;

export const ORCID_ADS_SOURCE_NAME = 'Astrophysics Data System';
export const ORCID_ADS_SOURCE_NAME_SHORT = 'ADS';
export const BRAND_NAME_FULL = 'Science Explorer';
export const BRAND_NAME_SHORT = 'SciX';
export const ORCID_BULK_DELETE_CHUNK_SIZE = 4;
export const ORCID_BULK_DELETE_DELAY = 1000;

export const EXTERNAL_URLS = {
  USGS_PLANETARY_FEATURES: 'https://planetarynames.wr.usgs.gov/Feature/' as const,
  NASA_HOME_PAGE: 'https://www.nasa.gov/' as const,
  SMITHSONIAN_HOME_PAGE: 'https://www.si.edu/' as const,
  CFA_HOME_PAGE: 'https://www.cfa.harvard.edu/' as const,
  NASA_SDE_HOME_PAGE: 'https://sciencediscoveryengine.nasa.gov/app/nasa-sba-smd/#/home',
  TWITTER_SCIX: 'https://twitter.com/scixcommunity' as const,
  CFA_SAO_HOME_PAGE: 'https://www.cfa.harvard.edu/sao' as const,
};

export const TRACING_HEADERS = ['X-Original-Uri', 'X-Original-Forwarded-For', 'X-Forwarded-For', 'X-Amzn-Trace-Id'];
