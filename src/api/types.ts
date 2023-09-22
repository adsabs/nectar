import { AxiosError } from 'axios';
import {
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';

export type ADSQuery<P, T, R = T, K extends QueryKey = QueryKey> = (
  props: P,
  options?: UseQueryOptions<T, Error | AxiosError, R, K>,
) => UseQueryResult<R, Error | AxiosError>;

export type InfiniteADSQuery<P, T, R = T, A = UseInfiniteQueryResult<R>> = (
  props: P,
  options?: UseInfiniteQueryOptions<T, Error | AxiosError, R>,
) => A;

export type ADSMutation<
  TData,
  TParams,
  TVariables,
  TError = Error | AxiosError,
  TResult = UseMutationResult<TData, TError, TVariables>,
> = (params?: TParams, options?: UseMutationOptions<TData, TError, TVariables>) => TResult;
