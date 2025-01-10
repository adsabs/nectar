export type SolrField =
  | 'abstract'
  | 'ack'
  | 'aff'
  | 'aff_id'
  | 'alternate_bibcode'
  | 'alternate_title'
  | 'arxiv_class'
  | 'author'
  | 'author_count'
  | 'author_facet'
  | 'author_facet_hier'
  | 'author_norm'
  | 'bibcode'
  | 'bibgroup'
  | 'bibgroup_facet'
  | 'bibstem'
  | 'bibstem_facet'
  | 'body'
  | 'citation'
  | 'citation_count'
  | 'cite_read_boost'
  | 'classic_factor'
  | 'comment'
  | 'copyright'
  | 'data'
  | 'data_facet'
  | 'database'
  | 'date'
  | 'doctype'
  | 'doctype_facet_hier'
  | 'doi'
  | 'eid'
  | 'email'
  | 'entdate'
  | 'entry_date'
  | 'esources'
  | 'facility'
  | 'first_author'
  | 'first_author_facet_hier'
  | 'first_author_norm'
  | 'planetary_feature'
  | 'planetary_feature_id'
  | 'grant'
  | 'grant_agencies'
  | 'grant_facet_hier'
  | 'grant_id'
  | 'id'
  | 'identifier'
  | 'ids_data'
  | 'indexstamp'
  | 'inst'
  | 'isbn'
  | 'issn'
  | 'issue'
  | 'keyword'
  | 'keyword_facet'
  | 'keyword_norm'
  | 'keyword_schema'
  | 'lang'
  | 'links_data'
  | 'nedid'
  | 'nedtype'
  | 'nedtype_object_facet_hier'
  | 'orcid_other'
  | 'orcid_pub'
  | 'orcid_user'
  | 'page'
  | 'page_count'
  | 'page_range'
  | 'property'
  | 'pub'
  | 'pub_raw'
  | 'pubdate'
  | 'pubnote'
  | 'read_count'
  | 'reader'
  | 'recid'
  | 'reference'
  | 'simbad_object_facet_hier'
  | 'simbid'
  | 'simbtype'
  | 'thesis'
  | 'title'
  | 'uat'
  | 'uat_id'
  | 'uat_facet_hier'
  | 'vizier'
  | 'vizier_facet'
  | 'volume'
  | 'year'
  | 'abs'
  | 'all'
  | 'arxiv'
  | 'citations()'
  | 'classic_relevance()'
  | 'full'
  | 'orcid'
  | 'pos()'
  | 'references()'
  | 'reviews()'
  | 'similar()'
  | 'topn()'
  | 'trending()'
  | 'useful()'
  | string;

export type SortField = SolrSortField | BiblibSortField;

export type SortType = SolrSort | BiblibSort;

export type SortDirection = 'desc' | 'asc';

export type SolrSortField =
  | 'author_count'
  | 'bibcode'
  | 'citation_count'
  | 'citation_count_norm'
  | 'classic_factor'
  | 'first_author'
  | 'date'
  | 'entry_date'
  | 'read_count'
  | 'score'
  | 'id';
export type SolrSort = `${SolrSortField} ${SortDirection}`;

export const solrSorts = [
  'author_count asc',
  'author_count desc',
  'bibcode asc',
  'bibcode desc',
  'citation_count asc',
  'citation_count desc',
  'citation_count_norm asc',
  'citation_count_norm desc',
  'classic_factor asc',
  'classic_factor desc',
  'first_author asc',
  'first_author desc',
  'date asc',
  'date desc',
  'entry_date asc',
  'entry_date desc',
  'id asc',
  'id desc',
  'read_count asc',
  'read_count desc',
  'score asc',
  'score desc',
] as const;

export type BiblibSortField =
  | 'author_count'
  | 'bibcode'
  | 'citation_count'
  | 'citation_count_norm'
  | 'classic_factor'
  | 'first_author'
  | 'date'
  | 'entry_date'
  | 'read_count'
  | 'id'
  | 'time';
export type BiblibSort = `${BiblibSortField} ${SortDirection}`;

export const biblibSorts = [
  'author_count asc',
  'author_count desc',
  'bibcode asc',
  'bibcode desc',
  'citation_count asc',
  'citation_count desc',
  'citation_count_norm asc',
  'citation_count_norm desc',
  'classic_factor asc',
  'classic_factor desc',
  'first_author asc',
  'first_author desc',
  'date asc',
  'date desc',
  'entry_date asc',
  'entry_date desc',
  'id asc',
  'id desc',
  'read_count asc',
  'read_count desc',
  'time asc',
  'time desc',
] as const;

export enum ApiTargets {
  // Accounts
  BOOTSTRAP = '/accounts/bootstrap',
  CHANGE_EMAIL = '/accounts/user/change-email',
  CHANGE_PASSWORD = '/accounts/user/change-password',
  CSRF = '/accounts/csrf',
  INFO = '/accounts/info',
  LOGIN = '/accounts/user/login',
  LOGOUT = '/accounts/user/logout',
  PROTECTED = '/accounts/protected',
  // REGISTER = '/accounts/register',
  RESET_PASSWORD = '/accounts/reset-password',
  STATUS = '/accounts/status',
  TOKEN = '/accounts/user/token',
  USER = '/accounts/user',
  VERIFY = '/accounts/verify',
  DELETE = '/accounts/user/delete',

  // Author Affiliation
  AUTHOR_AFFILIATION_EXPORT = '/author-affiliation/export',
  AUTHOR_AFFILIATION_SEARCH = '/author-affiliation/search',

  // Library Operations
  DOCUMENTS = '/biblib/documents',
  LIBRARIES = '/biblib/libraries',
  LIBRARY_IMPORT_ADS2_AUTH = '/harbour/auth/twopointoh',
  LIBRARY_IMPORT_ADS2_TO_BBB = '/biblib/twopointoh',
  LIBRARY_IMPORT_CLASSIC_AUTH = '/harbour/auth/classic',
  LIBRARY_IMPORT_CLASSIC_MIRRORS = '/harbour/mirrors',
  LIBRARY_IMPORT_CLASSIC_TO_BBB = '/biblib/classic',
  LIBRARY_IMPORT_CREDENTIALS = '/harbour/user',
  LIBRARY_IMPORT_MENDELEY = '/harbour/export/twopointoh/mendeley',
  LIBRARY_IMPORT_ZOTERO = '/harbour/export/twopointoh/zotero',
  LIBRARY_NOTES = 'biblib/notes',
  LIBRARY_OPERATION = 'biblib/libraries/operations',
  LIBRARY_QUERY = 'biblib/query',
  LIBRARY_TRANSFER = '/biblib/transfer',
  PERMISSIONS = '/biblib/permissions',

  // Orcid Operations
  ORCID = '/orcid',
  ORCID_EXCHANGE_TOKEN = '/orcid/exchangeOAuthCode',
  ORCID_NAME = '/orcid/orcid-name',
  ORCID_PREFERENCES = '/orcid/preferences',
  ORCID_PROFILE = 'orcid-profile',
  ORCID_WORK = 'orcid-work',
  ORCID_WORKS = 'orcid-works',

  // Vault Operations
  MYADS_NOTIFICATIONS = '/vault/notifications',
  MYADS_NOTIFICATIONS_QUERY = '/vault/notification_query',
  MYADS_STORAGE = '/vault',
  MYADS_STORAGE_QUERY = '/vault/query',
  SITE_CONFIGURATION = '/vault/configuration',
  USER_DATA = '/vault/user-data',
  LINK_SERVERS = '/vault/configuration/link_servers',

  // Search and Query
  BIGQUERY = '/search/bigquery',
  QTREE = '/search/qtree',
  SEARCH = '/search/query',

  // Services
  SERVICE_AUTHOR_AFFILIATION_EXPORT = '/authoraff',
  SERVICE_AUTHOR_NETWORK = '/vis/author-network',
  SERVICE_CITATION_HELPER = '/citation_helper',
  SERVICE_METRICS = '/metrics',
  SERVICE_OBJECTS = '/objects',
  SERVICE_OBJECTS_QUERY = '/objects/query',
  SERVICE_PAPER_NETWORK = '/vis/paper-network',
  SERVICE_WORDCLOUD = '/vis/word-cloud',

  // Miscellaneous
  EXPORT = '/export',
  FEEDBACK = '/feedback',
  GRAPHICS = '/graphics',
  RECOMMENDER = '/recommender',
  REFERENCE = '/reference/text',
  RESOLVER = '/resolver',
  JOURNAL = 'journals/journal',
  JOURNAL_SUMMARY = 'journals/browse',
  JOURNAL_ISSN = 'journals/issn',
}
