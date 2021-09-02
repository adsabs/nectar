import { IDocsEntity } from '@api';
import { RefreshIcon } from '@heroicons/react/solid';
import { useMachine } from '@xstate/react';
import { abstractPreviewInitialState, AbstractPreviewMachine, abstractPreviewMachine } from './machine/abstractPreview';

export interface IAbstractPreviewProps {
  id: IDocsEntity['id'];
  showAbstract?: boolean;
}
export const AbstractPreview = ({ id, showAbstract }: IAbstractPreviewProps): React.ReactElement => {
  const [state, send] = useMachine(abstractPreviewMachine.withContext({ ...abstractPreviewInitialState, id }), {
    devTools: true,
  });

  if (showAbstract && state.matches('idle')) {
    send({ type: AbstractPreviewMachine.TransitionTypes.GET_ABSTRACT });
  }

  return (
    <div className="flex">
      {state.matches('fetching') ? <RefreshIcon className="default-icon default-link-color" /> : null}
      <span className="ml-3 text-red-600">{state.matches('failure') && state.context.error?.message}</span>
      {showAbstract && state.matches('loaded') && <div className="mt-2 p-2 border">{state.context.meta.abstract}</div>}
    </div>
  );
};
