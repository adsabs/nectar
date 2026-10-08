import { AppMode } from '@/types';
import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';
import { isIADSSearchParams } from '@/utils/common/guards';

export const mapBoostTypeToAppMode: Record<AppMode, string> = {
  [AppMode.GENERAL]: 'general',
  [AppMode.ASTROPHYSICS]: 'astrophysics',
  [AppMode.HELIOPHYSICS]: 'heliophysics',
  [AppMode.PLANET_SCIENCE]: 'planetary',
  [AppMode.EARTH_SCIENCE]: 'earthscience',
  [AppMode.BIO_PHYSICAL]: 'general',
};

export const applyBoostType = (params: IADSApiSearchParams, mode: AppMode): IADSApiSearchParams => {
  const boostType = mapBoostTypeToAppMode[mode] || 'general';

  return isIADSSearchParams(params) ? { ...params, boostType } : { q: APP_DEFAULTS.EMPTY_QUERY, boostType };
};
