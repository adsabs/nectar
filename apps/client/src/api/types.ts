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

export type ADSQuery<
  TProps,
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TResult = UseQueryResult<TData, Error | AxiosError>,
  TQueryKey extends QueryKey = QueryKey,
> = (props: TProps, options?: UseQueryOptions<TQueryFnData, Error | AxiosError, TData, TQueryKey>) => TResult;

export type InfiniteADSQuery<
  TProps,
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TResult = UseInfiniteQueryResult<TData, Error | AxiosError>,
  TQueryKey extends QueryKey = QueryKey,
> = (
  props: TProps,
  options?: UseInfiniteQueryOptions<TQueryFnData, Error | AxiosError, TData, TQueryData, TQueryKey>,
) => TResult;

export type ADSMutation<
  TData,
  TParams,
  TVariables,
  TError = Error | AxiosError,
  TResult = UseMutationResult<TData, TError, TVariables>,
> = (params?: TParams, options?: UseMutationOptions<TData, TError, TVariables>) => TResult;
