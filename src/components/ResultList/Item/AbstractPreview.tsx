import { IDocsEntity } from '@api';
import { FolderIcon, FolderOpenIcon, RefreshIcon } from '@heroicons/react/solid';
import { useMachine } from '@xstate/react';
import React, { useEffect, MouseEvent } from 'react';
import { abstractPreviewInitialState, AbstractPreviewMachine, abstractPreviewMachine } from './machine/abstractPreview';

export interface IAbstractPreviewProps {
  id: IDocsEntity['id'];
}
export const AbstractPreview = ({ id }: IAbstractPreviewProps): React.ReactElement => {
  const [state, send] = useMachine(abstractPreviewMachine.withContext({ ...abstractPreviewInitialState, id }), {
    devTools: true,
  });
  const [showAbstract, setShowAbstract] = React.useState(false);

  useEffect(() => {
    if (state.matches('loaded')) {
      setShowAbstract(true);
    }
  }, [state]);

  const handleShowAbstractClick = (e: MouseEvent) => {
    e.preventDefault();
    if (state.matches('loaded')) {
      setShowAbstract(!showAbstract);
    } else {
      send({ type: AbstractPreviewMachine.TransitionTypes.GET_ABSTRACT });
    }
  };

  return (
    <div className="flex">
      <button
        title={showAbstract ? 'hide abstract' : 'show abstract'}
        onClick={handleShowAbstractClick}
        disabled={state.matches('failure')}
      >
        {state.matches('fetching') ? (
          <RefreshIcon className="default-icon default-link-color" />
        ) : showAbstract ? (
          <FolderOpenIcon className="default-icon default-link-color" />
        ) : (
          <FolderIcon className="default-icon default-link-color" />
        )}
      </button>
      <span className="ml-3 text-red-600">{state.matches('failure') && state.context.error?.message}</span>
      {showAbstract && <div className="mt-2 p-2 border">{state.context.meta.abstract}</div>}
    </div>
  );
};
