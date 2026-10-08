import { APP_DEFAULTS } from '@/config';
import { NumPerPageType } from '@/types';
import { Dispatch, Reducer, useCallback, useEffect, useReducer } from 'react';
import { isNumPerPageType } from '@/utils/common/guards';
import {
  calculatePage,
  calculatePagination,
  calculateStartIndex,
  cleanClamp,
  PaginationResult,
} from '@/lib/pagination';

export {
  calculatePage,
  calculatePagination,
  calculateStartIndex,
  cleanClamp,
  defaultPaginationResult,
  getTotalPages,
} from '@/lib/pagination';
export type { PaginationResult } from '@/lib/pagination';

export interface IUsePaginationProps {
  numFound: number;
  numPerPage?: NumPerPageType;
  page?: number;
  onStateChange?: (pagination: PaginationResult, state: IPaginationState, dispatch: Dispatch<PaginationAction>) => void;
}

export interface IUsePaginationResult extends PaginationResult {
  numPerPage: NumPerPageType;
  dispatch: Dispatch<PaginationAction>;
}

export interface IPaginationState {
  page: number;
  numPerPage: NumPerPageType;
  numFound: number;
}

export type PaginationAction =
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' }
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_NUMFOUND'; payload: number }
  | { type: 'SET_PERPAGE'; payload: NumPerPageType };

const reducer: Reducer<IPaginationState, PaginationAction> = (state, action) => {
  switch (action.type) {
    case 'NEXT_PAGE':
      return { ...state, page: state.page + 1 };
    case 'PREV_PAGE':
      return { ...state, page: state.page - 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'RESET':
      return { ...state, page: 1 };
    case 'SET_PERPAGE':
      // on perPage change, we should reset back to page 1
      return { ...state, numPerPage: action.payload, page: 1 };
    case 'SET_NUMFOUND':
      return { ...state, numFound: action.payload };
    default:
      return state;
  }
};

const initialState: IPaginationState = {
  page: 1,
  numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
  numFound: Number.MAX_SAFE_INTEGER,
};
/**
 * Pagination hook
 *
 * Basically wraps the pagination logic, also uses some memoization to reduce unnecessary renders.
 */
export const usePagination = (props: IUsePaginationProps) => {
  const { numFound = 0, page = 1, numPerPage = APP_DEFAULTS.RESULT_PER_PAGE, onStateChange } = props;
  const [state, dispatch] = useReducer(reducer, { ...initialState, page });

  useEffect(
    () =>
      dispatch({
        type: 'SET_PERPAGE',
        payload: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE,
      }),
    [numPerPage],
  );

  // watch page changes, this allows consumers to force changes via props
  useEffect(() => dispatch({ type: 'SET_PAGE', payload: cleanClamp(page, 1) }), [page]);

  // watch changes to numFound
  useEffect(() => dispatch({ type: 'SET_NUMFOUND', payload: cleanClamp(numFound, 0) }), [numFound]);

  // trigger onStateChange handler when state changes
  useEffect(() => {
    if (typeof onStateChange === 'function' && state.numFound > 0) {
      const pagination = calculatePagination({ ...state });
      onStateChange(pagination, state, dispatch);
    }
  }, [onStateChange, state]);

  const getPaginationProps = useCallback(() => {
    return {
      ...calculatePagination({ ...state }),
      numPerPage: state.numPerPage,
      dispatch,
    };
  }, [state]);

  return { getPaginationProps, calculatePage, calculatePagination, calculateStartIndex };
};
