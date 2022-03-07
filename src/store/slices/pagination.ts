import { APP_DEFAULTS } from '@config';
import { StoreSlice } from '@store';

interface IPaginationState {
  page: number;
  numPerPage: typeof APP_DEFAULTS['PER_PAGE_OPTIONS'][number];
}

export const initialPaginationState: IPaginationState = {
  page: 1,
  numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
};

export interface IAppStatePaginationSlice {
  pagination: IPaginationState;
  setPagination: (update: Partial<IPaginationState>) => void;
  resetPagination: () => void;
}

export const paginationSlice: StoreSlice<IAppStatePaginationSlice> = (set, get) => ({
  pagination: initialPaginationState,
  setPagination: (pagination) =>
    set({ pagination: { ...get().pagination, ...pagination } }, false, 'pagination/setPagination'),
  resetPagination: () => set({ pagination: initialPaginationState }, false, 'pagination/resetPagination'),
});
