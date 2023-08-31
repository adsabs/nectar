import api, { ADSMutation, ApiRequestConfig, ApiTargets } from '@api';
import { MutationFunction, useMutation } from '@tanstack/react-query';
import { IFeedbackParams, IADSApiFeedbackResponse } from './types';

const feedbackKeys = {
  general: () => ['feedback/general'] as const,
};

export const useFeedback: ADSMutation<IADSApiFeedbackResponse, undefined, Partial<IFeedbackParams>> = () => {
  return useMutation({
    mutationKey: feedbackKeys.general(),
    mutationFn: feedbackQueryFn,
    cacheTime: 0,
  });
};

const feedbackQueryFn: MutationFunction<IADSApiFeedbackResponse, Partial<IFeedbackParams>> = async (params) => {
  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.FEEDBACK,
    data: params,
  };

  const { data } = await api.request<IADSApiFeedbackResponse>(config);
  return data;
};
