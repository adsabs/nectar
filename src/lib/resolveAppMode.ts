import { AppMode } from '@/types';
import { mapDisciplineParamToAppMode } from '@/utils/appMode';

export interface ResolveAppModeInputs {
  forceModeParam?: string | string[];
  dParam?: string | string[];
  allowDisciplineParam: boolean;
  cookieMode?: AppMode;
}

export const resolveAppMode = ({
  forceModeParam,
  dParam,
  allowDisciplineParam,
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

  return cookieMode;
};
