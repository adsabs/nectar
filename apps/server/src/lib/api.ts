export const apiTargets = {
  // Authentication and User Management
  BOOTSTRAP: '/accounts/bootstrap',
  CSRF: '/accounts/csrf',
  USER: '/accounts/user',
  USER_DATA: '/vault/user-data',
  TOKEN: '/accounts/user/token',
  INFO: '/accounts/info',
  LOGIN: '/accounts/user/login',
  LOGOUT: '/accounts/user/logout',
  REGISTER: '/accounts/register',
  VERIFY: '/accounts/verify',
  DELETE: '/accounts/user/delete',
  RESET_PASSWORD: '/accounts/user/reset-password',
  CHANGE_PASSWORD: '/accounts/user/change-password',
  CHANGE_EMAIL: '/accounts/user/change-email',
  RESEND_VERIFY: '/accounts/user/{email}/verify',

  // Search and Query Services
  SEARCH: '/search/query',
  QTREE: '/search/qtree',
  BIGQUERY: '/search/bigquery',
  EXPORT: '/export',
  SERVICE_OBJECTS_QUERY: '/objects/query',

  // Visualization Services
  SERVICE_AUTHOR_NETWORK: '/vis/author-network',
  SERVICE_PAPER_NETWORK: '/vis/paper-network',
  SERVICE_WORDCLOUD: '/vis/word-cloud',

  // Metrics and Analytics
  SERVICE_METRICS: '/metrics',
  RECOMMENDER: '/recommender',

  // Storage and Vault
  MYADS_STORAGE: '/vault',
  MYADS_STORAGE_QUERY: '/vault/query',
  MYADS_NOTIFICATIONS: '/vault/notifications',
  MYADS_NOTIFICATIONS_QUERY: '/vault/notification_query',
  LINK_SERVERS: '/vault/configuration/link_servers',
  SITE_CONFIGURATION: '/vault/configuration',

  // Author and Affiliation Services
  AUTHOR_AFFILIATION_SEARCH: '/author-affiliation/search',
  AUTHOR_AFFILIATION_EXPORT: '/author-affiliation/export',
  SERVICE_AUTHOR_AFFILIATION_EXPORT: '/authoraff',

  // Citation and Reference Services
  SERVICE_CITATION_HELPER: '/citation_helper',
  REFERENCE: '/reference/text',

  // ORCID Integration
  ORCID_PREFERENCES: '/orcid/preferences',
  ORCID: '/orcid',
  ORCID_NAME: '/orcid/orcid-name',
  ORCID_WORKS: 'orcid-works',
  ORCID_WORK: 'orcid-work',
  ORCID_PROFILE: 'orcid-profile',
  ORCID_EXCHANGE_TOKEN: '/orcid/exchangeOAuthCode',

  // Library and Document Management
  LIBRARIES: '/biblib/libraries',
  LIBRARY_TRANSFER: '/biblib/transfer',
  LIBRARY_OPERATION: 'biblib/libraries/operations',
  LIBRARY_QUERY: 'biblib/query',
  LIBRARY_NOTES: 'biblib/notes',
  DOCUMENTS: '/biblib/documents',
  PERMISSIONS: '/biblib/permissions',

  // Feedback and Miscellaneous Services
  FEEDBACK: '/feedback/userfeedback',

  // Library Import Services
  LIBRARY_IMPORT_CLASSIC_AUTH: '/harbour/auth/classic',
  LIBRARY_IMPORT_CLASSIC_MIRRORS: '/harbour/mirrors',
  LIBRARY_IMPORT_CLASSIC_TO_BBB: '/biblib/classic',
  LIBRARY_IMPORT_ADS2_AUTH: '/harbour/auth/twopointoh',
  LIBRARY_IMPORT_ADS2_TO_BBB: '/biblib/twopointoh',
  LIBRARY_IMPORT_ZOTERO: '/harbour/export/twopointoh/zotero',
  LIBRARY_IMPORT_MENDELEY: '/harbour/export/twopointoh/mendeley',
  LIBRARY_IMPORT_CREDENTIALS: '/harbour/user',
} as const;

// Define the type for the keys of apiTargets
type ApiTargetKey = keyof typeof apiTargets;

// Utility function to get the API endpoint
export const getApiEndpoint = (key: ApiTargetKey): string => apiTargets[key];
