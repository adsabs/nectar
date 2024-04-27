import { IOrcidMutationParams, IOrcidResponse } from '@/api/orcid/types';
import { MutateOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export type OrcidHookOptions<K extends keyof IOrcidMutationParams & keyof IOrcidResponse> = UseMutationOptions<
  IOrcidResponse[K],
  Error | AxiosError,
  IOrcidMutationParams[K]['variables']
>;

export type OrcidMutationOptions<K extends keyof IOrcidMutationParams & keyof IOrcidResponse> = MutateOptions<
  IOrcidResponse[K],
  Error | AxiosError,
  IOrcidMutationParams[K]['variables']
>;
