import { IADSApiSearchParams, IADSApiSearchResponse, IHighlight, useGetHighlights } from '@api';
import { AxiosError } from 'axios';
import { useMemo } from 'react';
import { QueryKey, UseQueryOptions } from 'react-query';

export const useHighlights = (
  params: IADSApiSearchParams,
  options: UseQueryOptions<IADSApiSearchResponse, Error | AxiosError<unknown>, { [key: string]: IHighlight }, QueryKey>,
) => {
  const queryResult = useGetHighlights(params, options);
  const { data, isLoading, isSuccess, isError, error } = queryResult;

  // Highlight data to {id: [...highlight strings]}
  const highlights: { [id: string]: string[] } = useMemo(() => {
    if (data) {
      const res: { [id: string]: string[] } = {};
      Object.keys(data).forEach((key) => {
        res[key] = [];
        if (data[key].title) {
          res[key].push(...data[key].title);
        }
        if (data[key].abstract) {
          res[key].push(...data[key].abstract);
        }
      });
      return res;
    }
    return {};
  }, [data]);

  return { highlights, isLoading, isSuccess, isError, error };
};
