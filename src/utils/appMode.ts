import type { RouterCompat } from '@/lib/useRouterCompat';
import { AppMode } from '@/types';

export const SEARCH_PAGE_PATHNAMES = new Set(['/search']);

const disciplineMap: Record<string, AppMode> = {
  general: AppMode.GENERAL,
  astrophysics: AppMode.ASTROPHYSICS,
  heliophysics: AppMode.HELIOPHYSICS,
  planetary: AppMode.PLANET_SCIENCE,
  earth: AppMode.EARTH_SCIENCE,
  earthscience: AppMode.EARTH_SCIENCE,
  biophysical: AppMode.BIO_PHYSICAL,
};

const modeToDisciplineParam: Record<AppMode, string> = {
  [AppMode.GENERAL]: 'general',
  [AppMode.ASTROPHYSICS]: 'astrophysics',
  [AppMode.HELIOPHYSICS]: 'heliophysics',
  [AppMode.PLANET_SCIENCE]: 'planetary',
  [AppMode.EARTH_SCIENCE]: 'earth',
  [AppMode.BIO_PHYSICAL]: 'biophysical',
};

export const normalizeDisciplineParam = (value?: string | string[] | null): string | null => {
  if (!value) {
    return null;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = raw?.trim().toLowerCase();
  return normalized || null;
};

export const mapDisciplineParamToAppMode = (value?: string | string[]): AppMode | null => {
  const normalized = normalizeDisciplineParam(value);
  if (!normalized) {
    return null;
  }
  return disciplineMap[normalized] ?? null;
};

/**
 * Maps a URL path segment to an AppMode.
 * Used for discipline-specific routes like /astrophysics, /heliophysics, etc.
 */
export const mapPathToDisciplineParam = (path: string): string | null => {
  const segment = path.split('/')[1]?.toLowerCase();
  if (segment && disciplineMap[segment]) {
    return segment;
  }
  return null;
};

export const appModeToDisciplineParam = (mode?: AppMode | null): string | null => {
  if (!mode) {
    return null;
  }
  return modeToDisciplineParam[mode] ?? null;
};

export const getAppModeLabel = (mode: AppMode): string => {
  switch (mode) {
    case AppMode.ASTROPHYSICS:
      return 'Astrophysics';
    case AppMode.HELIOPHYSICS:
      return 'Heliophysics';
    case AppMode.PLANET_SCIENCE:
      return 'Planetary Science';
    case AppMode.EARTH_SCIENCE:
      return 'Earth Science';
    case AppMode.BIO_PHYSICAL:
      return 'Biological & Physical Science';
    case AppMode.GENERAL:
    default:
      return 'No preferred discipline';
  }
};

export const syncUrlDisciplineParamCompat = (router: RouterCompat, mode?: AppMode | null): void => {
  if (!SEARCH_PAGE_PATHNAMES.has(router.pathname)) {
    return;
  }

  const raw = router.query?.d;
  const target = appModeToDisciplineParam(mode);
  const current = normalizeDisciplineParam(raw);

  const alreadyNormalized = target === current && (typeof raw === 'string' ? raw === target : true);
  if (alreadyNormalized) {
    return;
  }

  const nextParams = new URLSearchParams(router.searchParams);
  if (target) {
    nextParams.set('d', target);
  } else {
    nextParams.delete('d');
  }

  const query = nextParams.toString();
  router.replace(query ? `${router.pathname}?${query}` : router.pathname, { shallow: true, scroll: false });
};
