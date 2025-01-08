import {
  IObjectsApiParams,
  IObjectsApiResponse,
  IObjectsQueryApiParams,
  IObjectsQueryApiResult,
  ObjectService,
} from '@/api/objects/types';
import { useQuery } from '@tanstack/react-query';
import { isNotEmpty } from 'ramda-adjunct';
import { hasObjectTerm, replaceObjectTerms } from '@/api/objects/helpers';
import { APP_DEFAULTS, TRACING_HEADERS } from '@/config';
import { defaultRequestConfig } from '../config';
import axios from 'axios';
import { GetServerSidePropsContext } from 'next';
import { pick } from 'ramda';
import { isString } from '@/utils/common/guards';
import { ADSQuery } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

export enum OBJECTS_API_KEYS {
  QUERY = 'object/query',
  OBJECTS = 'objects',
}

export const objectsApiKeys = {
  query: (params: IObjectsQueryApiParams) => [OBJECTS_API_KEYS.QUERY, params] as const,
  objects: (params: IObjectsApiParams) => [OBJECTS_API_KEYS.OBJECTS, params] as const,
};

export const useObjectQuery: ADSQuery<IObjectsQueryApiParams, IObjectsQueryApiResult> = (params, options) => {
  return useQuery({
    queryKey: objectsApiKeys.query(params),
    queryFn: () => resolveObjectQuery(params),
    enabled: isString(params.query) && isNotEmpty(params.query) && params.query.includes('object:'),
    ...options,
  });
};

export const resolveObjectQuery = async (params: IObjectsQueryApiParams) => {
  const { query } = params;

  // if query is a string and doesn't have an object term, just return the query
  if (isString(query) && !hasObjectTerm(query)) {
    return { query };
  } else if (!isString(query)) {
    return { query: APP_DEFAULTS.EMPTY_QUERY };
  }

  const config: ApiRequestConfig = {
    url: ApiTargets.SERVICE_OBJECTS_QUERY,
    method: 'POST',
    data: { query: [query] },
  };

  const { data } = await api.request<ObjectService['response']>(config);

  // if service returns a parsing error, just do our best to replace the object terms
  if (data.Error) {
    return { query: replaceObjectTerms(query) };
  }

  return data;
};

export const resolveObjectQuerySSR = async (params: IObjectsQueryApiParams, ctx: GetServerSidePropsContext) => {
  const { query } = params;

  const token = ctx.req.session?.token?.access_token;
  if (!token) {
    throw new Error('No Token');
  }

  // if query is a string and doesn't have an object term, just return the query
  if (isString(query) && !hasObjectTerm(query)) {
    return { query };
  } else if (!isString(query)) {
    return { query: APP_DEFAULTS.EMPTY_QUERY };
  }

  const config: ApiRequestConfig = {
    ...defaultRequestConfig,
    url: ApiTargets.SERVICE_OBJECTS_QUERY,
    method: 'POST',
    data: { query: [query] },
    headers: {
      ...pick(TRACING_HEADERS, ctx.req.headers),
      Authorization: `Bearer ${token}`,
    },
  };

  const { data } = await axios.request<ObjectService['response']>(config);

  // if service returns a parsing error, just do our best to replace the object terms
  if (data.Error) {
    return { query: replaceObjectTerms(query) };
  }

  return data;
};

export const useObjects: ADSQuery<IObjectsApiParams, IObjectsApiResponse> = (params, options) => {
  return useQuery({
    queryKey: objectsApiKeys.objects(params),
    queryFn: () => resolveObjects(params),
    ...options,
  });
};

export const resolveObjects = async (params: IObjectsApiParams) => {
  const { identifiers } = params;

  const config: ApiRequestConfig = {
    url: ApiTargets.SERVICE_OBJECTS,
    method: 'POST',
    data: { identifiers },
  };

  const { data } = await api.request<IObjectsApiResponse>(config);

  return data;
};
