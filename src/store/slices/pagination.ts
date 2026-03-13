import { APP_DEFAULTS } from '@/config';
import { StoreSlice } from '@/store';
import { NumPerPageType } from '@/types';
import { isNumPerPageType } from '@/utils/common/guards';

export interface IPaginationState {
  numPerPage: NumPerPageType;
}

export interface IPaginationAction {
  setNumPerPage: (numPerPage: NumPerPageType) => void;
}

export const paginationSlice: StoreSlice<IPaginationState & IPaginationAction> = (set) => ({
  numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,

  setNumPerPage: (numPerPage: NumPerPageType) =>
    set(
      () => ({ numPerPage: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE }),
      false,
      'pagination/setNumPerPage',
    ),
});
