import { IDocsEntity } from '@api';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Flex, Text, VStack } from '@chakra-ui/layout';
import { Collapse } from '@chakra-ui/transition';
import { IconButton } from '@chakra-ui/button';
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
    <Flex direction="column" justifyContent="center" alignContent="center">
      <Collapse in={state.context.show} animateOpacity>
        <Text fontSize="md" mt={1} dangerouslySetInnerHTML={{ __html: state.context.abstract }} />
      </Collapse>
      <VStack>
        <IconButton
          aria-label={state.context.show ? 'hide abstract' : 'show abstract'}
          onClick={() => send('load')}
          disabled={false}
          variant="unstyled"
          width="fit-content"
          isLoading={state.matches('fetching')}
          icon={state.context.show ? <ChevronUpIcon /> : <ChevronDownIcon />}
        />
      </VStack>
    </Flex>
  );
};
