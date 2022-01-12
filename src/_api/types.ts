import { UseQueryOptions } from 'react-query';

export type ADSQuery<P, R> = (props: P, options?: UseQueryOptions) => R;
