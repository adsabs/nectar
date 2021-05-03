import { IDocsEntity } from '@api';
import {
  faFolder,
  faFolderOpen,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import {
  abstractPreviewInitialState,
  AbstractPreviewMachine,
  abstractPreviewMachine,
} from './machine/abstractPreview';

export interface IAbstractPreviewProps {
  id: IDocsEntity['id'];
}
export const AbstractPreview = ({
  id,
}: IAbstractPreviewProps): React.ReactElement => {
  const [state, send] = useMachine(
    abstractPreviewMachine.withContext({ ...abstractPreviewInitialState, id }),
    { devTools: true },
  );
  const [showAbstract, setShowAbstract] = React.useState(false);

  useEffect(() => {
    if (state.matches('loaded')) {
      setShowAbstract(true);
    }
  }, [state]);

  const handleShowAbstractClick = () => {
    send({ type: AbstractPreviewMachine.TransitionTypes.GET_ABSTRACT });
    if (state.matches('loaded')) {
      setShowAbstract(!showAbstract);
    }
  };

  return (
    <div className="flex">
      <button
        onClick={handleShowAbstractClick}
        disabled={state.matches('failure')}
      >
        {state.matches('fetching') ? (
          <FontAwesomeIcon icon={faSpinner} pulse />
        ) : showAbstract ? (
          <FontAwesomeIcon icon={faFolderOpen} />
        ) : (
          <FontAwesomeIcon icon={faFolder} />
        )}
      </button>
      <span className="ml-3 text-red-600">
        {state.matches('failure') && state.context.error?.message}
      </span>
      {showAbstract && (
        <div className="border p-2 mt-2">{state.context.meta.abstract}</div>
      )}
    </div>
  );
};
