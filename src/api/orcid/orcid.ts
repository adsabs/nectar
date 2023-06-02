import api, { ADSMutation, ADSQuery, ApiRequestConfig, ApiTargets } from '@api';
import { MutationFunction, QueryFunction, useMutation, useQuery } from 'react-query';
import { IOrcidMutationParams, IOrcidParams, IOrcidResponse, IOrcidUser, IOrcidWork } from '@api/orcid/types';
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
  GET_PREFERENCES = 'orcid/get-preferences',
  SET_PREFERENCES = 'orcid/set-preferences',
}

const omitUser = omit(['user']);

export const orcidKeys = {
  exchangeToken: (params: IOrcidParams['exchangeToken']) => [OrcidKeys.EXCHANGE_TOKEN, omitUser(params)] as const,
  profile: (params: IOrcidParams['profile']) => [OrcidKeys.PROFILE, omitUser(params)] as const,
  name: (params: IOrcidParams['name']) => [OrcidKeys.NAME, omitUser(params)] as const,
  getWork: (params: IOrcidParams['getWork']) => [OrcidKeys.GET_WORK, omitUser(params)] as const,
  addWorks: () => [OrcidKeys.ADD_WORKS] as const,
  removeWorks: () => [OrcidKeys.REMOVE_WORKS] as const,
  getPreferences: (params: IOrcidParams['getPreferences']) => [OrcidKeys.GET_PREFERENCES, omitUser(params)] as const,
  setPreferences: () => [OrcidKeys.SET_PREFERENCES],
};

type OrcidQuery<K extends keyof IOrcidParams & keyof IOrcidResponse> = ADSQuery<IOrcidParams[K], IOrcidResponse[K]>;

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
    mutationFn: ({ work }) =>
      updateWork({
        params,
        variables: { work },
      }),
    ...options,
  });
};

export const useOrcidAddWorks: OrcidMutation<'addWorks'> = (params, options) => {
  return useMutation({
    mutationKey: orcidKeys.addWorks(),
    mutationFn: ({ works }) =>
      addWorks({
        params,
        variables: { works },
      }),
    ...options,
  });
};

export const useOrcidRemoveWorks: OrcidMutation<'removeWorks'> = (params, options) => {
  return useMutation({
    mutationKey: orcidKeys.removeWorks(),
    mutationFn: ({ putcodes }) =>
      removeWorks({
        params,
        variables: { putcodes },
      }),
    ...options,
  });
};

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

export const useOrcidSetPreferences: OrcidMutation<'setPreferences'> = (params, options) => {
  return useMutation({
    mutationKey: orcidKeys.setPreferences(),
    mutationFn: ({ preferences }) =>
      setPreferences({
        params,
        variables: { preferences },
      }),
    ...options,
  });
};

export const useOrcidPreferences: OrcidQuery<'getPreferences'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.getPreferences(params),
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

const getPreferences: QueryFunction<IOrcidResponse['getPreferences']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['getPreferences'] };

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

  const { data } = await api.request<IOrcidResponse['getPreferences']>(config);
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

const removeWorks: MutationFunction<IOrcidResponse['removeWorks'], IOrcidMutationParams['removeWorks']> = async ({
  params,
  variables,
}) => {
  const { user } = params;
  const { putcodes } = variables;

  if (!isValidIOrcidUser(user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    url: `${ApiTargets.ORCID}/${user.orcid}/${ApiTargets.ORCID_WORKS}`,
    method: 'DELETE',
    headers: {
      'orcid-authorization': `Bearer ${user.access_token}`,
    },
  };

  const makeRequest = async (putcode: IOrcidWork['put-code']) => {
    await api.request({
      ...config,
      url: `${config.url}/${putcode}`,
    });
  };

  const result = await Promise.allSettled(putcodes.map(makeRequest));

  return Object.fromEntries(putcodes.map((putcode, index) => [putcode, result[index]]));
};

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
  const { work } = variables;

  if (!isValidIOrcidUser(user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    method: 'PUT',
    url: `${ApiTargets.ORCID}/${user.orcid}/${ApiTargets.ORCID_WORKS}/${work['put-code']}`,
    headers: {
      'orcid-authorization': `Bearer ${user.access_token}`,
    },
    data: work,
  };

  const { data } = await api.request<IOrcidResponse['updateWork']>(config);

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

const setPreferences: MutationFunction<IOrcidResponse['setPreferences'], IOrcidMutationParams['setPreferences']> =
  async ({ params, variables }) => {
    const { user } = params;
    const { preferences } = variables;

    if (!isValidIOrcidUser(user)) {
      throw new Error('Invalid ORCiD User');
    }

    const config: ApiRequestConfig = {
      method: 'POST',
      url: `${ApiTargets.ORCID_PREFERENCES}/${user.orcid}`,
      data: preferences,
      headers: {
        'orcid-authorization': `Bearer ${user.access_token}`,
      },
    };

    const { data } = await api.request<IOrcidResponse['setPreferences']>(config);
    return data;
  };
