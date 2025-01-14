import { MutationFunction, QueryFunction, useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { omit } from 'ramda';
import { getVaultBigQueryParams } from './models';
import {
  IADSApiAddNotificationParams,
  IADSApiAddNotificationResponse,
  IADSApiDeleteNotificationParams,
  IADSApiDeleteNotificationResponse,
  IADSApiEditNotificationParams,
  IADSApiEditNotificationResponse,
  IADSApiLibraryLinkServersResponse,
  IADSApiNotificationParams,
  IADSApiNotificationQueryParams,
  IADSApiNotificationQueryResponse,
  IADSApiNotificationReponse,
  IADSApiNotificationsReponse,
  IADSApiVaultResponse,
  IADSVaultExecuteQueryParams,
} from './types';
import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity } from '@/api/search/types';
import { ADSMutation, ADSQuery } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

export enum VaultKeys {
  VAULT = 'vault',
  EXECUTE_QUERY = 'vault/execute_query',
  BIGQUERY = 'vault/bigquery',
  LIBRARY_LINK_SERVERS = 'vault/library_link_servers',
  NOTIFICATIONS = 'vault/notifications',
  NOTIFICATION = 'vault/notification',
  ADD_NOTIFICATION = 'vault/add_notification',
  EDIT_NOTIFICATION = 'vault/edit_notification',
  DEL_NOTIFICATION = 'vault/del_notification',
  NOTIFICATION_QUERY = 'vault/notification_query',
}

export const vaultKeys = {
  primary: (params: IADSApiSearchParams) => [VaultKeys.VAULT, { params }] as const,
  executeQuery: (qid: IADSVaultExecuteQueryParams['qid']) => [VaultKeys.EXECUTE_QUERY, { qid }] as const,
  bigquery: (bibcodes: IDocsEntity['bibcode'][]) => [VaultKeys.BIGQUERY, { bibcodes }] as const,
  libraryLinkServers: () => [VaultKeys.LIBRARY_LINK_SERVERS] as const,
  notifications: () => [VaultKeys.NOTIFICATIONS] as const,
  notification: (id: string) => [VaultKeys.NOTIFICATION, { id }] as const,
  addNotification: () => [VaultKeys.ADD_NOTIFICATION] as const,
  editNotification: () => [VaultKeys.EDIT_NOTIFICATION] as const,
  delNotification: () => [VaultKeys.DEL_NOTIFICATION] as const,
  notificationQuery: (id: string) => [VaultKeys.NOTIFICATION_QUERY, { id }] as const,
};

/**
 * Generic search, allows for any solr query params
 * Vault will save this query and return a QID for use in other searches/filters/etc.
 */
export const useVaultSearch: ADSQuery<IADSApiSearchParams, IADSApiVaultResponse> = (params, options) => {
  return useQuery({
    queryKey: vaultKeys.primary(params),
    queryFn: fetchVaultSearch,
    meta: { params },
    ...options,
  });
};

/**
 * Request to vault to retreive the cached query by QID
 */
export const useVaultExecuteQuery: ADSQuery<IADSVaultExecuteQueryParams, IADSApiVaultResponse> = ({ qid }, options) => {
  const params = { qid };
  return useQuery({
    queryKey: vaultKeys.executeQuery(qid),
    queryFn: fetchVaultSearch,
    meta: { params },
    ...options,
  });
};

/**
 * Request to vault to save a bigquery search (for set of bibcodes) with sensible defaults
 */
export const useVaultBigQuerySearch: ADSQuery<IDocsEntity['bibcode'][], IADSApiVaultResponse> = (bibcodes, options) => {
  const params = getVaultBigQueryParams(bibcodes);
  return useQuery({
    queryKey: vaultKeys.bigquery(bibcodes),
    queryFn: fetchVaultSearch,
    meta: { params },
    ...options,
  });
};

export const fetchVaultSearch: QueryFunction<IADSApiVaultResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.MYADS_STORAGE_QUERY,
    data: params,
  };

  const { data } = await api.request<IADSApiVaultResponse>(config);
  return data;
};

export const fetchVaultExecuteQuery: QueryFunction<IADSApiSearchResponse['response']> = async ({ meta }) => {
  const { params } = meta as { params: IADSVaultExecuteQueryParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.MYADS_STORAGE}/execute_query/${params.qid}`,
  };

  const { data } = await api.request<IADSApiSearchResponse['response']>(config);
  return data;
};

export const fetchLibraryLinkServers: QueryFunction<IADSApiLibraryLinkServersResponse> = async ({}) => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.LINK_SERVERS,
  };

  const { data } = await api.request<IADSApiLibraryLinkServersResponse>(config);
  return data;
};

export const useLibraryLinkServers = (options?: UseQueryOptions<IADSApiLibraryLinkServersResponse>) => {
  return useQuery({
    queryKey: vaultKeys.libraryLinkServers(),
    queryFn: fetchLibraryLinkServers,
    ...options,
  });
};

// email notifications

// get all notification

export const useGetNotifications = (options?: UseQueryOptions<IADSApiNotificationsReponse>) => {
  return useQuery({
    queryKey: vaultKeys.notifications(),
    queryFn: fetchNotifications,
    ...options,
  });
};

export const fetchNotifications: QueryFunction<IADSApiNotificationsReponse> = async ({}) => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.MYADS_NOTIFICATIONS,
  };

  const { data } = await api.request<IADSApiNotificationsReponse>(config);
  return data;
};

// get single notification

export const useGetNotification: ADSQuery<IADSApiNotificationParams, IADSApiNotificationReponse> = (
  params,
  options,
) => {
  return useQuery({
    queryKey: vaultKeys.notification(params.id.toString()),
    meta: { params },
    queryFn: fetchNotification,
    ...options,
  });
};

export const fetchNotification: QueryFunction<IADSApiNotificationReponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiNotificationParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.MYADS_NOTIFICATIONS}/${params.id.toString()}`,
  };

  const { data } = await api.request<IADSApiNotificationReponse>(config);
  return data;
};

// add notification

export const useAddNotification: ADSMutation<IADSApiAddNotificationResponse, undefined, IADSApiAddNotificationParams> =
  (_, options) => {
    return useMutation({
      mutationKey: vaultKeys.addNotification(),
      mutationFn: addNotification,
      ...options,
    });
  };

export const addNotification: MutationFunction<IADSApiAddNotificationResponse, IADSApiAddNotificationParams> = async (
  params,
) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.MYADS_NOTIFICATIONS,
    data: params,
  };

  const { data } = await api.request<IADSApiAddNotificationResponse>(config);
  return data;
};

// edit notification

export const useEditNotification: ADSMutation<
  IADSApiEditNotificationResponse,
  undefined,
  IADSApiEditNotificationParams
> = (_, options) => {
  return useMutation({
    mutationKey: vaultKeys.editNotification(),
    mutationFn: editNotification,
    ...options,
  });
};

export const editNotification: MutationFunction<IADSApiEditNotificationResponse, IADSApiEditNotificationParams> =
  async (params) => {
    const config: ApiRequestConfig = {
      method: 'PUT',
      url: `${ApiTargets.MYADS_NOTIFICATIONS}/${params.id}`,
      data: omit(['id'], params),
    };

    const { data } = await api.request<IADSApiEditNotificationResponse>(config);
    return data;
  };

export const useDelNotification: ADSMutation<
  IADSApiDeleteNotificationResponse,
  undefined,
  IADSApiDeleteNotificationParams
> = (_, options) => {
  return useMutation({
    mutationKey: vaultKeys.delNotification(),
    mutationFn: deleteNotification,
    ...options,
  });
};

export const deleteNotification: MutationFunction<IADSApiDeleteNotificationResponse, IADSApiDeleteNotificationParams> =
  async ({ id }) => {
    const config: ApiRequestConfig = {
      method: 'DELETE',
      url: `${ApiTargets.MYADS_NOTIFICATIONS}/${id}`,
    };

    const { data } = await api.request<IADSApiDeleteNotificationResponse>(config);
    return data;
  };

// get notification query

export const useGetNotificationQuery: ADSQuery<IADSApiNotificationQueryParams, IADSApiNotificationQueryResponse> = (
  params,
  options,
) => {
  return useQuery({
    queryKey: vaultKeys.notificationQuery(params.id.toString()),
    meta: { params },
    queryFn: fetchNotificationQuery,
    ...options,
  });
};

export const fetchNotificationQuery: QueryFunction<IADSApiNotificationQueryResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiNotificationParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.MYADS_NOTIFICATIONS_QUERY}/${params.id.toString()}`,
  };

  const { data } = await api.request<IADSApiNotificationQueryResponse>(config);
  return data;
};
