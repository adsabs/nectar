import api, {
  ADSMutation,
  ADSQuery,
  ApiRequestConfig,
  ApiTargets,
  IADSApiLibraryAddParams,
  IADSApiLibraryAddResponse,
  IADSApiLibraryDeleteParams,
  IADSApiLibraryDeleteResponse,
  IADSApiLibraryDocumentParams,
  IADSApiLibraryDocumentResponse,
  IADSApiLibraryEditMetaParams,
  IADSApiLibraryEditMetaResponse,
  IADSApiLibraryEntityParams,
  IADSApiLibraryEntityResponse,
  IADSApiLibraryOperationParams,
  IADSApiLibraryOperationResponse,
  IADSApiLibraryParams,
  IADSApiLibraryPermissionParams,
  IADSApiLibraryPermissionResponse,
  IADSApiLibraryPermissionUpdateParams,
  IADSApiLibraryPermissionUpdateResponse,
  IADSApiLibraryQueryParams,
  IADSApiLibraryQueryResponse,
  IADSApiLibraryQueryUpdateParams,
  IADSApiLibraryQueryUpdateResponse,
  IADSApiLibraryResponse,
  IADSApiLibraryTransferParams,
  IADSApiLibraryTransferResponse,
} from '@api';
import { MutationFunction, QueryFunction, useMutation, useQuery } from '@tanstack/react-query';
import { omit } from 'ramda';

export enum LIBRARY_API_KEYS {
  LIBRARIES = 'library/libraries',
  LIBRARY = 'library/library',
  ADD = 'library/add',
  DELETE = 'library/delete',
  EDIT = 'library/edit',
  OPERATION = 'library/operation',
  DOCUMENT = 'library/document',
  QUERY = 'library/query',
  QUERY_UPDATE = 'library/query-update',
  PERMISSION = 'library/permission',
  PERMISSION_UPDATE = 'library/permission-update',
  TRANSFER = 'library/transfer',
}

export const librariesKeys = {
  libraries: (params: IADSApiLibraryParams) => [LIBRARY_API_KEYS.LIBRARIES, params] as const,
  library: (params: IADSApiLibraryEntityParams) => [LIBRARY_API_KEYS.LIBRARY, params],
  add: () => [LIBRARY_API_KEYS.ADD] as const,
  delete: () => [LIBRARY_API_KEYS.DELETE] as const,
  edit: () => [LIBRARY_API_KEYS.EDIT] as const,
  operation: () => [LIBRARY_API_KEYS.OPERATION] as const,
  document: () => [LIBRARY_API_KEYS.DOCUMENT] as const,
  query: () => [LIBRARY_API_KEYS.QUERY] as const,
  query_update: () => [LIBRARY_API_KEYS.QUERY_UPDATE] as const,
  permission: (params: IADSApiLibraryPermissionParams) => [LIBRARY_API_KEYS.PERMISSION, params],
  permission_update: () => [LIBRARY_API_KEYS.PERMISSION_UPDATE] as const,
  transfer: () => [LIBRARY_API_KEYS.TRANSFER] as const,
};

// libraries

export const useGetLibraries: ADSQuery<IADSApiLibraryParams, IADSApiLibraryResponse> = (params, options) => {
  return useQuery({
    queryKey: librariesKeys.libraries(params),
    queryFn: fetchLibraries,
    meta: { params },
    ...options,
  });
};

export const fetchLibraries: QueryFunction<IADSApiLibraryResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiLibraryParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.LIBRARIES,
    params,
  };

  const { data } = await api.request<IADSApiLibraryResponse>(config);
  return data;
};

export const useAddLibrary: ADSMutation<IADSApiLibraryAddResponse, undefined, IADSApiLibraryAddParams> = (
  _,
  options,
) => {
  return useMutation({
    mutationKey: librariesKeys.add(),
    mutationFn: addLibrary,
    ...options,
  });
};

export const addLibrary: MutationFunction<IADSApiLibraryAddResponse, IADSApiLibraryAddParams> = async (params) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.LIBRARIES}`,
    data: params,
  };

  const { data } = await api.request<IADSApiLibraryAddResponse>(config);
  return data;
};

export const useGetLibraryEntity: ADSQuery<IADSApiLibraryEntityParams, IADSApiLibraryEntityResponse> = (
  params,
  options,
) => {
  return useQuery({
    queryKey: librariesKeys.library(params),
    queryFn: fetchLibraryEntity,
    meta: { params },
    ...options,
  });
};

export const fetchLibraryEntity: QueryFunction<IADSApiLibraryEntityResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiLibraryEntityParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.LIBRARIES}/${params.id}`,
    params: omit(['id'], params),
  };

  const { data } = await api.request<IADSApiLibraryEntityResponse>(config);
  return data;
};

// documents

export const useDeleteLibrary: ADSMutation<IADSApiLibraryDeleteResponse, undefined, IADSApiLibraryDeleteParams> = (
  _,
  options,
) => {
  return useMutation({
    mutationKey: librariesKeys.delete(),
    mutationFn: deleteLibrary,
    ...options,
  });
};

export const deleteLibrary: MutationFunction<IADSApiLibraryDeleteResponse, IADSApiLibraryDeleteParams> = async ({
  id,
}) => {
  const config: ApiRequestConfig = {
    method: 'DELETE',
    url: `${ApiTargets.DOCUMENTS}/${id}`,
  };

  const { data } = await api.request<IADSApiLibraryDeleteResponse>(config);
  return data;
};

export const useEditLibraryMeta: ADSMutation<IADSApiLibraryEditMetaResponse, undefined, IADSApiLibraryEditMetaParams> =
  (_, options) => {
    return useMutation({
      mutationKey: librariesKeys.edit(),
      mutationFn: editLibraryMeta,
      ...options,
    });
  };

export const editLibraryMeta: MutationFunction<IADSApiLibraryEditMetaResponse, IADSApiLibraryEditMetaParams> = async (
  params,
) => {
  const config: ApiRequestConfig = {
    method: 'PUT',
    url: `${ApiTargets.DOCUMENTS}/${params.id}`,
    data: omit(['id'], params),
  };

  const { data } = await api.request<IADSApiLibraryEditMetaResponse>(config);
  return data;
};

export const useEditLibraryDocuments: ADSMutation<
  IADSApiLibraryDocumentResponse,
  undefined,
  IADSApiLibraryDocumentParams
> = (_, options) => {
  return useMutation({
    mutationKey: librariesKeys.document(),
    mutationFn: editLibraryDocuments,
    ...options,
  });
};

export const editLibraryDocuments: MutationFunction<IADSApiLibraryDocumentResponse, IADSApiLibraryDocumentParams> =
  async (params) => {
    const config: ApiRequestConfig = {
      method: 'POST',
      url: `${ApiTargets.DOCUMENTS}/${params.id}`,
      data: omit(['id'], params),
    };

    const { data } = await api.request<IADSApiLibraryDocumentResponse>(config);
    return data;
  };

// operations

export const useLibraryOperation: ADSMutation<
  IADSApiLibraryOperationResponse,
  undefined,
  IADSApiLibraryOperationParams
> = (_, options) => {
  return useMutation({
    mutationKey: librariesKeys.operation(),
    mutationFn: operation,
    ...options,
  });
};

export const operation: MutationFunction<IADSApiLibraryOperationResponse, IADSApiLibraryOperationParams> = async (
  params,
) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.LIBRARY_OPERATION}/${params.id}`,
    data: omit(['id'], params),
  };

  const { data } = await api.request<IADSApiLibraryOperationResponse>(config);
  return data;
};

// query

export const useAddDocumentsByQuery: ADSMutation<IADSApiLibraryQueryResponse, undefined, IADSApiLibraryQueryParams> = (
  _,
  options,
) => {
  return useMutation({
    mutationKey: librariesKeys.query(),
    mutationFn: addDocumentsByQuery,
    ...options,
  });
};

export const addDocumentsByQuery: MutationFunction<IADSApiLibraryQueryResponse, IADSApiLibraryQueryParams> = async (
  params,
) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.LIBRARY_QUERY}/${params.id}`,
    data: params,
  };

  const { data } = await api.request<IADSApiLibraryQueryResponse>(config);
  return data;
};

export const useUpdateDocumentsByQuery: ADSMutation<
  IADSApiLibraryQueryUpdateResponse,
  undefined,
  IADSApiLibraryQueryUpdateParams
> = (_, options) => {
  return useMutation({
    mutationKey: librariesKeys.query_update(),
    mutationFn: updateDocumentsByQuery,
    ...options,
  });
};

export const updateDocumentsByQuery: MutationFunction<
  IADSApiLibraryQueryUpdateResponse,
  IADSApiLibraryQueryUpdateParams
> = async (params) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.LIBRARY_QUERY}/${params.id}`,
    data: omit(['id'], params),
  };

  const { data } = await api.request<IADSApiLibraryQueryUpdateResponse>(config);
  return data;
};

// permissions

export const useGetPermission: ADSQuery<IADSApiLibraryPermissionParams, IADSApiLibraryPermissionResponse> = (
  params,
  options,
) => {
  return useQuery({
    queryKey: librariesKeys.permission(params),
    queryFn: getPermission,
    meta: { params },
    ...options,
  });
};

export const getPermission: QueryFunction<IADSApiLibraryPermissionResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiLibraryPermissionParams };
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.PERMISSIONS}/${params.id}`,
  };

  const { data } = await api.request<IADSApiLibraryPermissionResponse>(config);
  return data;
};

export const useModifyPermission: ADSMutation<
  IADSApiLibraryPermissionUpdateResponse,
  undefined,
  IADSApiLibraryPermissionUpdateParams
> = (_, options) => {
  return useMutation({
    mutationKey: librariesKeys.query_update(),
    mutationFn: modifyPermission,
    ...options,
  });
};

export const modifyPermission: MutationFunction<
  IADSApiLibraryPermissionUpdateResponse,
  IADSApiLibraryPermissionUpdateParams
> = async (params) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.PERMISSIONS}/${params.id}`,
    data: omit(['id'], params),
  };

  const { data } = await api.request<IADSApiLibraryPermissionUpdateResponse>(config);
  return data;
};

// transfer

export const useTransfer: ADSMutation<IADSApiLibraryTransferResponse, undefined, IADSApiLibraryTransferParams> = (
  _,
  options,
) => {
  return useMutation({
    mutationKey: librariesKeys.transfer(),
    mutationFn: transfer,
    ...options,
  });
};

export const transfer: MutationFunction<IADSApiLibraryTransferResponse, IADSApiLibraryTransferParams> = async (
  params,
) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.LIBRARY_TRANSFER}/${params.id}`,
    data: omit(['id'], params),
  };

  const { data } = await api.request<IADSApiLibraryTransferResponse>(config);
  return data;
};
