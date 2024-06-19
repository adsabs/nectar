export const ssrRoutes = [
  // Public Information and SEO-Driven Pages
  '/abs/', // Abstract details, important for SEO
  '/search/authoraffiliations', // Author affiliations, requires data pre-fetching
  '/search/author_network', // Visualization of author networks
  '/search/concept_cloud', // Concept visualization
  '/search/overview', // Overview of search results
  '/search/paper_network', // Paper network visualization
  '/search/results_graph', // Graphical representation of results

  // User-Specific Data Pages
  '/user/libraries/', // User libraries, requires fetching user-specific data
  '/user/notifications/index', // User notifications
  '/user/orcid/index', // ORCID profile data
  '/user/orcid/OAuth', // OAuth handling, secure token management

  // User Settings Pages
  '/user/settings/application', // User application settings
  '/user/settings/delete', // Account deletion, sensitive operation
  '/user/settings/email', // User email settings
  '/user/settings/export', // Data export, requires secure handling
  '/user/settings/librarylink', // Linking to external libraries
  '/user/settings/orcid', // ORCID settings
  '/user/settings/password', // Password management
  '/user/settings/token', // Token management
];

export const nonSsrRoutes = [
  // Static and Error Pages
  '/404', // Not Found error page
  '/500', // Internal Server Error page
  '/not-implemented', // Placeholder page for unimplemented features
  '/paper-form', // Static form page

  // API and Utility Pages
  '/api/bibstems/', // API endpoint for bibliographic stems
  '/api/experiments/planetary', // API endpoint for planetary experiments
  '/api/isBot', // Utility for bot detection
  '/api/monitor', // Monitoring endpoint

  // Feedback Pages
  '/feedback/associatedarticles', // Feedback related to associated articles
  '/feedback/general', // General feedback form
  '/feedback/missingrecord', // Feedback for missing records
  '/feedback/missingreferences', // Feedback for missing references

  // Public Libraries and Public Data
  '/public-libraries/', // Public library listings
  '/search/exportcitation/', // Exporting citations, can be handled client-side

  // User Account and Authentication Pages
  '/user/account/forgotpassword', // Secure password recovery
  '/user/account/login', // User authentication, token handling
  '/user/account/register', // User registration, may involve user-specific data
  '/user/account/verify/reset-password/', // Password reset verification
];
