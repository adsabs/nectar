import { IDocsEntity } from '@api';
import { Transition } from '@headlessui/react';
import { ChevronDoubleDownIcon, ChevronDoubleUpIcon } from '@heroicons/react/outline';
import { RefreshIcon } from '@heroicons/react/solid';
import { useAPI } from '@hooks';
import { useMachine } from '@xstate/react';
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
          ({ response: { docs } }) => (typeof docs[0].abstract === 'undefined' ? 'No Abstract' : docs[0].abstract),
          (e) => {
            throw e;
          },
        );
      },
      initialContext: { abstract: '', show: false },
    }),
  );

  return (
    <div className="flex flex-col items-center justify-center">
      <Transition
        show={state.context.show}
        enter="transition-opacity duration-75"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="mt-2" dangerouslySetInnerHTML={{ __html: state.context.abstract }}></div>
      </Transition>
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
          <ChevronDoubleUpIcon className="default-icon-sm my-1 text-gray-300" />
        ) : (
          <ChevronDoubleDownIcon className="default-icon-sm text-gray-300" />
        )}
      </button>
    </div>
  );
};
