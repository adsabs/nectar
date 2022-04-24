import { AxiosError } from 'axios';
import { UseInfiniteQueryOptions, UseInfiniteQueryResult, UseQueryOptions, UseQueryResult } from 'react-query';

export type ADSQuery<P, T, R = T, A = UseQueryResult<R>> = (
  props: P,
  options?: UseQueryOptions<T, Error | AxiosError, R>,
) => A;

export type InfiniteADSQuery<P, T, R = T, A = UseInfiniteQueryResult<R>> = (
  props: P,
  options?: UseInfiniteQueryOptions<T, Error | AxiosError, R>,
) => A;
