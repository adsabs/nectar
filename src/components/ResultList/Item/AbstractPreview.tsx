import { IDocsEntity } from '@api';
import { Transition } from '@headlessui/react';
import { FolderIcon, FolderOpenIcon, RefreshIcon } from '@heroicons/react/solid';
import { useAPI } from '@hooks';
import { useMachine } from '@xstate/react';
import React from 'react';
import { assign, ContextFrom, DoneInvokeEvent } from 'xstate';
import { createModel } from 'xstate/lib/model';

const createAbstractPreviewMachine = ({
  initialContext,
  fetchAbstract,
}: {
  initialContext: { abstract: string; show: boolean };
  fetchAbstract: () => Promise<string>;
}) => {
  const model = createModel(initialContext, {
    events: {
      load: () => ({}),
    },
  });

  return model.createMachine({
    id: 'abstract-preview',
    initial: 'idle',
    states: {
      idle: {
        on: {
          load: 'fetching',
        },
      },
      fetching: {
        invoke: {
          src: fetchAbstract,
          onDone: {
            target: 'done',
            actions: assign<ContextFrom<typeof model>, DoneInvokeEvent<string>>({
              abstract: (_, ev) => ev.data,
              show: true,
            }),
          },
        },
      },
      done: {
        on: {
          load: {
            actions: model.assign({
              show: (ctx) => !ctx.show,
            }),
          },
        },
      },
    },
  });
};

export interface IAbstractPreviewProps {
  id: IDocsEntity['id'];
}
export const AbstractPreview = ({ id }: IAbstractPreviewProps): React.ReactElement => {
  const { api } = useAPI();
  const [state, send] = useMachine(
    createAbstractPreviewMachine({
      fetchAbstract: async () => {
        const result = await api.search.query({ q: `id:${id}`, fl: ['abstract'] });
        return result.match(
          ({ docs }) => (typeof docs[0].abstract === 'undefined' ? 'No Abstract' : docs[0].abstract),
          (e) => {
            throw e;
          },
        );
      },
      initialContext: { abstract: '', show: false },
    }),
  );

  return (
    <div>
      <button
        type="button"
        title={state.context.show ? 'hide abstract' : 'show abstract'}
        onClick={() => send('load')}
        disabled={false}
        className="flex-col items-start"
      >
        {state.matches('fetching') ? (
          <RefreshIcon className="default-icon default-link-color transform rotate-180 animate-spin" />
        ) : state.context.show ? (
          <FolderOpenIcon className="default-icon default-link-color" />
        ) : (
          <FolderIcon className="default-icon default-link-color" />
        )}
      </button>
      <Transition
        show={state.context.show}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="prose prose-md mt-2 p-2 max-w-none border shadow-md"
          dangerouslySetInnerHTML={{ __html: state.context.abstract }}
        ></div>
      </Transition>
    </div>
  );
};
