import { AppState, useStore } from '@/store';
import { AppMode } from '@/types';
import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';
import { isIADSSearchParams } from '@/utils/common/guards';

const appModeSelector = (state: AppState) => state.mode;

const mapBoostTypeToAppMode: Record<AppMode, string> = {
  [AppMode.GENERAL]: 'general',
  [AppMode.ASTROPHYSICS]: 'astrophysics',
  [AppMode.HELIOPHYSICS]: 'heliophysics',
  [AppMode.PLANET_SCIENCE]: 'planetary',
  [AppMode.EARTH_SCIENCE]: 'earthscience',
  [AppMode.BIO_PHYSICAL]: 'general',
};

export const useApplyBoostTypeToParams = (options: {
  params: IADSApiSearchParams;
}): { params: IADSApiSearchParams } => {
  const appMode = useStore(appModeSelector);
  const boostType = mapBoostTypeToAppMode[appMode] || 'general';

  return isIADSSearchParams(options.params)
    ? { params: { ...options.params, boostType } }
    : { params: { q: APP_DEFAULTS.EMPTY_QUERY, boostType } };
};
