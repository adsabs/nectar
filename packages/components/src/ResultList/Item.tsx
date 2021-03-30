import { faFolder, faFolderOpen, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IDocsEntity } from '@nectar/api';
import { DocTransition, IDocMachine } from '@nectar/context';
import { useActor } from '@xstate/react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { ActorRef } from 'xstate';
import { createNullActor } from 'xstate/lib/Actor';

interface IItemProps {
  doc: Partial<IDocsEntity>;
  index: number;
  service: ActorRef<DocTransition, IDocMachine['state']>
}

export const Item = (props: IItemProps): React.ReactElement => {
  const { doc, index, service = createNullActor(`doc`) } = props;
  const { bibcode = '', pubdate = '', title = '', author = [], id } = doc;
  const actor = useActor(service);
  const [, send] = actor;
  const state = actor[0] as IDocMachine['state'];
  console.log('doc', state);

  const [showAbstract, setShowAbstract] = React.useState(false);

  useEffect(() => {
    if (state.matches('abstract.loaded')) {
      setShowAbstract(true);
    }
  }, [(state.value as { abstract: string }).abstract])

  const handleSelect = () => {
    send({ type: 'TOGGLE_SELECT' });
  };

  const handleShowAbstractClick = () => {
    send({ type: 'GET_ABSTRACT' });
    if (state.matches('abstract.loaded')) {
      setShowAbstract(!showAbstract);
    }
  }

  return (
    <div className="flex border py-1 px-2 rounded-md bg-white">
      <div className="hidden md:flex items-center justify-center mr-3">
        {index}
      </div>
      <div className="hidden md:flex items-center justify-center mr-3">
        <input
          type="checkbox"
          name={`result-checkbox-${index}`}
          id={`result-checkbox-${index}`}
          onChange={handleSelect}
          checked={state.context.selected}
        />
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex justify-between">
          <Link href={`/abs/${bibcode}`}>
            <a className="text-xs hover:underline">{bibcode}</a>
          </Link>
          <div className="text-xs">{pubdate}</div>
        </div>
        <Link href={`/abs/${bibcode}`}>
          <a className="text-blue-700 text-lg hover:underline">
            <h3>{title}</h3>
          </a>
        </Link>
        <div className="text-xs">{author.slice(0, 3).join('; ')}</div>
        <div className="flex">
          <button onClick={handleShowAbstractClick} disabled={state.matches('abstract.failure')}>{
            state.matches('abstract.fetching')
              ? <FontAwesomeIcon icon={faSpinner} pulse />
              : showAbstract
                ? <FontAwesomeIcon icon={faFolderOpen} />
                : <FontAwesomeIcon icon={faFolder} />
          }</button>
          <span className="ml-3 text-red-600">
            {
              state.matches('abstract.failure') && state.context.error?.message
            }
          </span>
        </div>
        {showAbstract &&
          <div className="border p-2 mt-2">{state.context.meta.abstract}</div>
        }
      </div>
    </div>
  );
};
