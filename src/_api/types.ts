import { UseQueryOptions, UseQueryResult } from 'react-query';

export type ADSQuery<P, T, R = T, A = UseQueryResult<R>> = (props: P, options?: UseQueryOptions<T, Error, R>) => A;
