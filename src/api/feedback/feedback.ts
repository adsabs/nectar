import { MutationFunction, useMutation } from '@tanstack/react-query';
import { IADSApiFeedbackResponse, IFeedbackParams } from './types';
import { ADSMutation } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

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
