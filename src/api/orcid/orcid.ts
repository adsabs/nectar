import api, { ADSQuery, ApiRequestConfig, ApiTargets } from '@api';
import { QueryFunction, useQuery } from 'react-query';
import { IOrcidParams, IOrcidResponse, IOrcidUser } from '@api/orcid/types';
import { AppState } from '@store';
import { isValidIOrcidUser } from '@api/orcid/models';

export enum OrcidKeys {
  EXCHANGE_TOKEN = 'orcid/exchange-token',
  PROFILE = 'orcid/profile',
  NAME = 'orcid/name',
  UPDATE_WORK = 'orcid/update-work',
  ADD_WORKS = 'orcid/add-works',
  REMOVE_WORKS = 'orcid/remove-works',
  PREFERENCES = 'orcid/preferences',
}

export const orcidKeys = {
  exchangeToken: (params: IOrcidParams['exchangeToken']) => [OrcidKeys.EXCHANGE_TOKEN, params] as const,
  profile: (params: IOrcidParams['profile']) => [OrcidKeys.PROFILE, params] as const,
  name: (params: IOrcidParams['name']) => [OrcidKeys.NAME, params] as const,
  updateWork: (params: IOrcidParams['updateWork']) => [OrcidKeys.UPDATE_WORK, params] as const,
  addWorks: (params: IOrcidParams['addWorks']) => [OrcidKeys.ADD_WORKS, params] as const,
  removeWorks: (params: IOrcidParams['removeWorks']) => [OrcidKeys.REMOVE_WORKS, params] as const,
  preferences: (params: IOrcidParams['preferences']) => [OrcidKeys.PREFERENCES, params] as const,
};

type OrcidQuery<K extends keyof typeof orcidKeys> = ADSQuery<IOrcidParams[K], IOrcidResponse[K]>;

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

export const useOrcidUpdateWork: OrcidQuery<'updateWork'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.updateWork(params),
    queryFn: updateWork,
    meta: { params },
    ...options,
  });
};

export const useOrcidAddWorks: OrcidQuery<'addWorks'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.addWorks(params),
    queryFn: addWorks,
    meta: { params },
    ...options,
  });
};
export const useOrcidRemoveWorks: OrcidQuery<'removeWorks'> = (params, options) => {
  return useQuery({
    queryKey: orcidKeys.removeWorks(params),
    queryFn: removeWorks,
    meta: { params },
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

const removeWorks: QueryFunction<IOrcidResponse['removeWorks']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['removeWorks'] };

  if (!isValidIOrcidUser(params.user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    method: 'DELETE',
    // TODO handle bulk deletions
    url: `${ApiTargets.ORCID}/${params.user.orcid}/${ApiTargets.ORCID_WORKS}/${params.works[0]}`,
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };

  const { data } = await api.request<null>(config);
  return data;
};

const addWorks: QueryFunction<IOrcidResponse['addWorks']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['addWorks'] };

  if (!isValidIOrcidUser(params.user)) {
    throw new Error('Invalid ORCiD User');
  }

  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.ORCID}/${params.user.orcid}/${ApiTargets.ORCID_WORKS}`,
    data: {
      bulk: params.works,
    },
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };

  const { data } = await api.request<null>(config);
  return data;
};

const updateWork: QueryFunction<IOrcidResponse['updateWork']> = async ({ meta }) => {
  const { params } = meta as { params: IOrcidParams['updateWork'] };

  if (!isValidIOrcidUser(params.user)) {
    throw new Error('Invalid ORCiD User');
  }

  const url = `${ApiTargets.ORCID}/${params.user.orcid}/${ApiTargets.ORCID_WORKS}/${params.work['put-code']}`;

  const getConfig: ApiRequestConfig = {
    method: 'GET',
    url,
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };
  const putConfig: ApiRequestConfig = {
    method: 'PUT',
    url,
    data: params.work,
    headers: {
      'orcid-authorization': `Bearer ${params.user.access_token}`,
    },
  };

  const res = await Promise.all([api.request<null>(getConfig), api.request<null>(putConfig)]);

  // TODO: figure out what data is needed with this call, transform here

  return res[1].data;
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
