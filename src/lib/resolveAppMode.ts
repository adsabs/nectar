import { AppMode } from '@/types';
import { mapDisciplineParamToAppMode } from '@/utils/appMode';
import { safeGetArray } from '@/utils/common/to-array';

export interface ResolveAppModeInputs {
  forceModeParam?: string | string[];
  dParam?: string | string[];
  fromADSParam?: string | string[];
  allowDisciplineParam: boolean;
  allowFromADSParam?: boolean;
  cookieMode?: AppMode;
}

export const resolveAppMode = ({
  forceModeParam,
  dParam,
  fromADSParam,
  allowDisciplineParam,
  allowFromADSParam = false,
  cookieMode,
}: ResolveAppModeInputs): AppMode | undefined => {
  const forceMode = mapDisciplineParamToAppMode(forceModeParam);
  if (forceMode) {
    return forceMode;
  }

  const urlMode = allowDisciplineParam ? mapDisciplineParamToAppMode(dParam) : null;
  if (urlMode) {
    return urlMode;
  }

  if (allowFromADSParam && safeGetArray(fromADSParam)[0] === 'true') {
    return AppMode.ASTROPHYSICS;
  }

  return cookieMode;
};
