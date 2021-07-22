import { useInterpret, useSelector } from '@xstate/react';
import { initialContext, searchMachine } from './searchMachine';
import { Context, Transition } from './types';

export interface IUseSearchMachineProps {
  initialResult?: Context['result'];
  initialParams?: Context['params'];
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useSearchMachine(props: IUseSearchMachineProps = {}) {
  const { initialResult, initialParams } = props;

  const initialState = {
    ...initialContext,
    ...(initialResult && { result: initialResult }),
    ...(initialParams && { params: initialParams }),
  };
  const service = useInterpret<Context, Transition>(searchMachine.withContext(initialState), { devTools: true });

  const state = {
    service,
    result: useSelector(service, (state) => state.context.result),
    error: useSelector(service, (state) => state.context.error),
    isLoading: useSelector(service, (state) => state.matches('fetching')),
    isFailure: useSelector(service, (state) => state.matches('failure')),
  };

  return state;
}
