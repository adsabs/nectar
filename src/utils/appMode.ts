import { NextRouter } from 'next/router';
import { AppMode } from '@/types';

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
      return 'General Science';
  }
};

export const syncUrlDisciplineParam = async (router: NextRouter, mode?: AppMode | null): Promise<void> => {
  if (!router.isReady) {
    return;
  }

  // Only write the discipline param on the search page.
  if (router.pathname !== '/search') {
    return;
  }

  const raw = router.query?.d;
  const target = appModeToDisciplineParam(mode);
  const current = normalizeDisciplineParam(raw);

  // If the normalized value matches but raw casing differs, rewrite to normalize the URL.
  const alreadyNormalized = target === current && (typeof raw === 'string' ? raw === target : true);
  if (alreadyNormalized) {
    return;
  }

  const nextQuery = { ...router.query };
  if (target) {
    nextQuery.d = target;
  } else {
    delete nextQuery.d;
  }

  const href = { pathname: router.pathname, query: nextQuery };
  const options = { shallow: true, scroll: false };

  // Prefer internal history replace to avoid reloads when only query changes.
  await router.replace(href, undefined, options);
};
