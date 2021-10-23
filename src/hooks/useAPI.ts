import { APIContext, apiCtx } from '@providers/api';
import { useContext } from 'react';

export const useAPI = (): APIContext => {
  const context = useContext(apiCtx);
  if (typeof context === 'undefined') {
    throw new Error('no provider for AppContext');
  }
  return { api: context.api };
};
