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

  const service = useInterpret<Context, Transition>(
    searchMachine.withContext({
      ...initialContext,
      ...(initialResult && { result: initialResult }),
      ...(initialParams && { params: initialParams }),
    }),
    { devTools: true },
  );

  service.onTransition((state) => {
    console.log(state);
  });

  const result = useSelector(service, (state) => state.context.result);
  const error = useSelector(service, (state) => state.context.error);
  const isLoading = useSelector(service, (state) => state.matches('fetching'));
  const isFailure = useSelector(service, (state) => state.matches('failure'));

  return { service, result, error, isLoading, isFailure };
}
