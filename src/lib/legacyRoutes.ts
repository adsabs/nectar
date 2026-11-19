export const LEGACY_STANDALONE_ROOTS: readonly string[] = ['classic-form', 'index', 'paper-form'];

export const LEGACY_PAYLOAD_ROOTS: readonly string[] = ['abs', 'public-libraries', 'search', 'user'];

export const LEGACY_ROUTE_ROOTS: readonly string[] = [...LEGACY_STANDALONE_ROOTS, ...LEGACY_PAYLOAD_ROOTS];

export const ABS_VIEWS: ReadonlySet<string> = new Set([
  'abstract',
  'citations',
  'coreads',
  'credits',
  'exportcitation',
  'graphics',
  'mentions',
  'metrics',
  'references',
  'similar',
  'toc',
]);

export const ABS_VIEW_ALIASES: ReadonlyMap<string, string> = new Map([['figures', 'graphics']]);

export const SEARCH_SUB_ROUTES: ReadonlySet<string> = new Set([
  'authoraffiliations',
  'author_network',
  'citation_helper',
  'concept_cloud',
  'exportcitation',
  'metrics',
  'overview',
  'paper_network',
  'results_graph',
]);

const BBB_SEARCH_SUB_ROUTES: ReadonlyMap<string, string> = new Map([
  ['show-author-affiliation-tool', 'authoraffiliations'],
  ['show-author-network', 'author_network'],
  ['show-bubble-chart', 'results_graph'],
  ['show-citation-helper', 'citation_helper'],
  ['show-concept-cloud', 'concept_cloud'],
  ['show-metrics', 'metrics'],
  ['show-overview', 'overview'],
  ['show-paper-network', 'paper_network'],
]);

const SETTINGS_SECTIONS: ReadonlySet<string> = new Set([
  'application',
  'delete',
  'email',
  'export',
  'libraries',
  'librarylink',
  'orcid',
  'password',
  'token',
]);

const BBB_SETTINGS_SECTIONS: ReadonlyMap<string, string> = new Map([
  ['libraryimport', '/user/settings/libraries'],
  ['myads', '/user/notifications'],
  ['preferences', '/user/settings/application'],
]);

const BIBCODE_LENGTH = 19;

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

const reencode = (segment: string): string => encodeURIComponent(decodeSegment(segment));

const toPageNumber = (raw: string | null): number | null => {
  if (raw === null) {
    return null;
  }
  const index = Number.parseInt(raw, 10);
  if (!Number.isInteger(index) || index < 0) {
    return null;
  }
  return index + 1;
};

export const translateLegacySearchParams = (raw: string): URLSearchParams => {
  const source = new URLSearchParams(raw);
  const target = new URLSearchParams();

  source.forEach((value, key) => {
    if (key !== 'p_') {
      target.append(key, value);
    }
  });

  const page = toPageNumber(source.get('p_'));
  if (page !== null) {
    target.set('p', String(page));
  }

  return target;
};

const translateSearchParams = (raw: string): string | null => {
  if (!raw) {
    return null;
  }

  const target = translateLegacySearchParams(raw);
  return target.get('q') ? target.toString() : null;
};

export const splitLegacySearchTail = (tail: string): { paramString: string; subRoute: string | null } => {
  const segments = tail.split('/');
  if (segments.length > 1 && segments[segments.length - 1] === '') {
    segments.pop();
  }
  if (segments.length < 2) {
    return { paramString: segments.join('/'), subRoute: null };
  }

  const last = segments[segments.length - 1];
  const previous = segments[segments.length - 2];

  if (previous === 'export' || previous === 'exportcitation') {
    return {
      paramString: segments.slice(0, -2).join('/'),
      subRoute: `exportcitation/${reencode(last)}`,
    };
  }

  const exportFormat = /^export-(.+)$/.exec(last);
  if (exportFormat) {
    return {
      paramString: segments.slice(0, -1).join('/'),
      subRoute: `exportcitation/${reencode(exportFormat[1])}`,
    };
  }

  const subRoute = BBB_SEARCH_SUB_ROUTES.get(last) ?? (SEARCH_SUB_ROUTES.has(last) ? last : null);
  if (subRoute) {
    return { paramString: segments.slice(0, -1).join('/'), subRoute };
  }

  return { paramString: segments.join('/'), subRoute: null };
};

const resolveAbsRoute = (segments: string[]): string | null => {
  const parts = segments.filter((segment) => segment !== '');
  if (!parts.length) {
    return null;
  }

  const last = parts[parts.length - 1];
  const previous = parts.length > 1 ? parts[parts.length - 2] : undefined;

  if (previous === 'exportcitation' && parts.length > 2) {
    const id = reencode(parts.slice(0, -2).join('/'));
    return `/abs/${id}/exportcitation/${reencode(last)}`;
  }

  const aliasedView = ABS_VIEW_ALIASES.get(last) ?? (ABS_VIEWS.has(last) ? last : null);
  if (aliasedView && parts.length > 1) {
    const id = reencode(parts.slice(0, -1).join('/'));
    return `/abs/${id}/${aliasedView}`;
  }

  if (parts.length > 1 && decodeSegment(parts[0]).length === BIBCODE_LENGTH) {
    return `/abs/${reencode(parts[0])}/abstract`;
  }

  return `/abs/${reencode(parts.join('/'))}/abstract`;
};

const resolveSearchRoute = (tail: string): string | null => {
  const { paramString, subRoute } = splitLegacySearchTail(tail);
  const query = translateSearchParams(paramString);

  if (!query) {
    return null;
  }

  return subRoute ? `/search/${subRoute}?${query}` : `/search?${query}`;
};

const resolveSettingsRoute = (section?: string): string => {
  if (!section) {
    return '/user/settings';
  }

  const mapped = BBB_SETTINGS_SECTIONS.get(section);
  if (mapped) {
    return mapped;
  }

  return SETTINGS_SECTIONS.has(section) ? `/user/settings/${section}` : '/user/settings';
};

const VERIFY_KINDS: ReadonlySet<string> = new Set(['change-email', 'register', 'reset-password']);

const resolveAccountRoute = (segments: string[]): string | null => {
  const [subView, ...rest] = segments;

  if (subView === 'login' || subView === 'register') {
    return `/user/account/${subView}`;
  }

  if (subView === 'forgotpassword' || subView === 'reset-password') {
    return '/user/account/forgotpassword';
  }

  if (subView === 'verify' && VERIFY_KINDS.has(rest[0]) && rest[1]) {
    return `/user/account/verify/${rest[0]}/${reencode(rest[1])}`;
  }

  return null;
};

const resolveUserRoute = (segments: string[]): string | null => {
  const [section, ...rest] = segments;

  switch (section) {
    case 'account':
      return resolveAccountRoute(rest);
    case 'forgotpassword':
      return '/user/account/forgotpassword';
    case 'home':
      return '/';
    case 'libraries':
      return rest[0] ? `/user/libraries/${rest.map(reencode).join('/')}` : '/user/libraries';
    case 'notifications':
      return '/user/notifications';
    case 'orcid':
      return '/user/orcid';
    case 'settings':
      return resolveSettingsRoute(rest[0]);
    default:
      return null;
  }
};

export const resolveLegacyHashRoute = (hash: string): string | null => {
  const route = hash.replace(/^#!?\/?/, '');
  if (!route) {
    return null;
  }

  const [root, ...rest] = route.split('/');

  switch (root) {
    case 'abs':
      return resolveAbsRoute(rest);
    case 'classic-form':
      return '/classic-form';
    case 'index':
      return '/';
    case 'paper-form':
      return '/paper-form';
    case 'public-libraries':
      return rest[0] ? `/public-libraries/${reencode(rest[0])}` : null;
    case 'search':
      return resolveSearchRoute(rest.join('/'));
    case 'user':
      return resolveUserRoute(rest);
    default:
      return null;
  }
};
