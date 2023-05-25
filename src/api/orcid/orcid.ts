import api, { ADSMutation, ADSQuery, ApiRequestConfig, ApiTargets } from '@api';
import { MutationFunction, QueryFunction, useMutation, useQuery } from 'react-query';
import { IOrcidMutationParams, IOrcidParams, IOrcidResponse, IOrcidUser } from '@api/orcid/types';
import { AppState } from '@store';
import { isValidIOrcidUser } from '@api/orcid/models';
import { omit } from 'ramda';

export enum OrcidKeys {
  EXCHANGE_TOKEN = 'orcid/exchange-token',
  PROFILE = 'orcid/profile',
  NAME = 'orcid/name',
  GET_WORK = 'orcid/get-work',
  UPDATE_WORK = 'orcid/update-work',
  ADD_WORKS = 'orcid/add-works',
  REMOVE_WORKS = 'orcid/remove-works',
  PREFERENCES = 'orcid/preferences',
}

const omitUser = omit(['user']);

export const orcidKeys = {
  exchangeToken: (params: IOrcidParams['exchangeToken']) => [OrcidKeys.EXCHANGE_TOKEN, omitUser(params)] as const,
  profile: (params: IOrcidParams['profile']) => [OrcidKeys.PROFILE, omitUser(params)] as const,
  name: (params: IOrcidParams['name']) => [OrcidKeys.NAME, omitUser(params)] as const,
  getWork: (params: IOrcidParams['getWork']) => [OrcidKeys.GET_WORK, omitUser(params)] as const,
  addWorks: (params: IOrcidParams['addWorks']) => [OrcidKeys.ADD_WORKS, omitUser(params)] as const,
  removeWorks: (params: IOrcidParams['removeWorks']) => [OrcidKeys.REMOVE_WORKS, omitUser(params)] as const,
  preferences: (params: IOrcidParams['preferences']) => [OrcidKeys.PREFERENCES, omitUser(params)] as const,
};

type OrcidQuery<
  K extends keyof IOrcidParams & keyof IOrcidResponse
> = ADSQuery<IOrcidParams[K], IOrcidResponse[K]>;

type OrcidMutation<K extends keyof IOrcidMutationParams & keyof IOrcidResponse> = ADSMutation<
  IOrcidResponse[K],
  IOrcidMutationParams[K]['params'],
  IOrcidMutationParams[K]['variables']
>;

export const useOrcidExchangeToken: OrcidQuery<'exchangeToken'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.exchangeToken(params),
    queryFn: fetchExchangeToken,
    meta: { params },
    cacheTime: 0,
    staleTime: 0,
    ...options,
  });
};

const orcidUserSelector = (store: AppState) => store.orcid.user;
export const useOrcidGetProfile: OrcidQuery<'profile'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.profile(params),
    queryFn: fetchProfile,
    meta: { params },
    ...options,
  });
};

export const useOrcidUpdateWork: OrcidMutation<'updateWork'> = (params, options) => {
  return useMutation({
    mutationFn: ({ putcode }) =>
      updateWork({
        params,
        variables: { putcode },
      }),
    ...options,
  });
};

export const useOrcidAddWorks: OrcidMutation<'addWorks'> = (params, options) => {
  return useMutation({
    mutationFn: ({ works }) =>
      addWorks({
        params,
        variables: { works },
      }),
    ...options,
  });
};
// export const useOrcidRemoveWorks: OrcidQuery<'removeWorks'> = (params, options) => {
//   return useQuery({
//     queryKey: orcidKeys.removeWorks(params),
//     queryFn: removeWorks,
//     meta: { params },
//     ...options,
//   });
// };

export const useOrcidGetName: OrcidQuery<'name'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.name(params),
    queryFn: getName,
    meta: { params },
    ...options,
  });
};

export const useOrcidGetWork: OrcidQuery<'getWork'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.getWork(params),
    queryFn: getWork,
    meta: { params },
    ...options,
  });
};

export const useOrcidPreferences: OrcidQuery<'preferences'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.preferences(params),
    queryFn: getPreferences,
    meta: { params },
    ...options,
  });
};

const fetchExchangeToken: QueryFunction<IOrcidUser> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['exchangeToken'] };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.ORCID_EXCHANGE_TOKEN,
    params,
  };

  const { data } = await api.request<IOrcidUser>(config);
  return data;
};

const getPreferences: QueryFunction<IOrcidResponse['preferences']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['preferences'] };

  if (!isValidIOrcidUser(params.user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.ORCID_PREFERENCES}/${params.user.orcid}`,
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };

  const { data } = await api.request<IOrcidResponse['preferences']>(config);
  return data;
};

const fetchProfile: QueryFunction<IOrcidResponse['profile']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['profile'] };

  if (!isValidIOrcidUser(params.user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.ORCID}/${params.user.orcid}/${ApiTargets.ORCID_PROFILE}${params.full ?? true ? '/full' : ''}${
      params.update ?? true ? '?update=true' : ''
    }`,
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };

  const { data } = await api.request<IOrcidResponse['profile']>(config);
  return data;
};

// const removeWorks: QueryFunction<IOrcidResponse['removeWorks']> = async ({ meta }) => {
//   const { params } = meta as { params: IOrcidParams['removeWorks'] };
//
//   if (!isValidIOrcidUser(params.user)) {
//     throw new Error('Invalid ORCiD User');
//   }
//
//   const config: ApiRequestConfig = {
//     method: 'DELETE',
//     // TODO handle bulk deletions
//     url: `${ApiTargets.ORCID}/${params.user.orcid}/${ApiTargets.ORCID_WORKS}/${params.works[0]}`,
//     headers: {
//       'orcid-authorization': `Bearer ${params.user.access_token}`,
//     },
//   };
//
//   const { data } = await api.request<null>(config);
//   return data;
// };

// url: `${ApiTargets.ORCID}/${params.user.orcid}/${ApiTargets.ORCID_WORKS}`,
const addWorks: MutationFunction<IOrcidResponse['addWorks'], IOrcidMutationParams['addWorks']> = async ({
  params,
  variables,
}) => {
  const { user } = params;
  const { works } = variables;

  if (!isValidIOrcidUser(user)) {
    throw new Error('Invalid ORCiD User');
  }

  const addWorksConfig: ApiRequestConfig = {
    url: `${ApiTargets.ORCID}/${user.orcid}/${ApiTargets.ORCID_WORKS}`,
    method: 'POST',
    data: {
      bulk: works.map((work) => ({ work })),
    },
    headers: {
      'orcid-authorization': `Bearer ${user.access_token}`,
    },
  };

  const { data } = await api.request<IOrcidResponse['addWorks']>(addWorksConfig);

  return data;
};

const updateWork: MutationFunction<IOrcidResponse['updateWork'], IOrcidMutationParams['updateWork']> = async ({
  params,
  variables,
}) => {
  const { user } = params;
  const { putcode } = variables;
  if (!isValidIOrcidUser(user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    url: `${ApiTargets.ORCID}/${user.orcid}/${ApiTargets.ORCID_WORKS}/${variables.putcode}`,
    headers: {
      'orcid-authorization': `Bearer ${user.access_token}`,
    },
  };

  const getWorkConfig: ApiRequestConfig = {
    method: 'GET',
    ...config,
  };

  const { data: work } = await api.request<IOrcidResponse['updateWork']>(getWorkConfig);

  const updateWorkConfig: ApiRequestConfig = {
    method: 'PUT',
    data: work,
    ...config,
  };

  const { data } = await api.request<IOrcidResponse['updateWork']>(updateWorkConfig);

  return data;
};
const getName: QueryFunction<IOrcidResponse['name']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['name'] };

  if (!isValidIOrcidUser(params.user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.ORCID_NAME}/${params.user.orcid}`,
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };

  const { data } = await api.request<null>(config);
  return data;
};

const getWork: QueryFunction<IOrcidResponse['getWork']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['getWork'] };

  if (!isValidIOrcidUser(params.user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.ORCID}/${params.user.orcid}/${ApiTargets.ORCID_WORKS}/${params.putcode}`,
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };

  const { data } = await api.request<null>(config);
  return data;
};
