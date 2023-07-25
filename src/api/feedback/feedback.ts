import api, { ApiRequestConfig, ApiTargets } from '@api';
import { QueryFunction, useQuery } from '@tanstack/react-query';
import { IFeedbackParams, FeedbackADSQuery, IADSApiFeedbackResponse } from './types';

const feedbackKeys = {
  general: (params: IFeedbackParams) => ['feedback/general', { params }] as const,
};

export const useFeedback: FeedbackADSQuery = (params, options) => {
  return useQuery({
    queryKey: feedbackKeys.general(params),
    queryFn: feedbackQueryFn,
    meta: { params },
    ...options,
    cacheTime: 0,
  });
};

const feedbackQueryFn: QueryFunction<IADSApiFeedbackResponse> = async ({ meta }) => {
  const { params } = meta as { params: Partial<IFeedbackParams> };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.FEEDBACK}`,
    data: params,
  };

  const { data } = await api.request<IADSApiFeedbackResponse>(config);
  return data;
};
