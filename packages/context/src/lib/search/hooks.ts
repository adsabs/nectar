import { useInterpret, useSelector } from '@xstate/react';
import React from 'react';
import { SearchMachineTransitionTypes } from '.';
import { searchMachine } from './searchMachine';
import { Context } from './types';

export interface IUseSearchMachineProps {
  initialResult: Context['result'];
  initialParams: Context['params'];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSearchMachine(props: IUseSearchMachineProps) {
  const { initialResult, initialParams } = props;

  const service = useInterpret(searchMachine, { devTools: true });

  React.useEffect(() => {
    if (initialResult) {
      service.send({
        type: SearchMachineTransitionTypes.SET_RESULT,
        payload: { result: initialResult },
      });
    }
    if (initialParams) {
      service.send({
        type: SearchMachineTransitionTypes.SET_PARAMS,
        payload: { params: initialParams },
      });
    }
  }, []);

  const result = useSelector(service, state => state.context.result);
  const error = useSelector(service, state => state.context.error);
  const isLoading = useSelector(service, state => state.matches('fetching'));
  const isFailure = useSelector(service, state => state.matches('failure'));

  return { service, result, error, isLoading, isFailure };
}
