import { IADSApiSearchParams, IDocsEntity } from '@api';
import { useAPI } from '@hooks';
import { useBaseRouterPath } from '@utils';
import { useMachine } from '@xstate/react';
import { useRouter } from 'next/router';
import PT from 'prop-types';
import qs from 'qs';
import { HTMLAttributes, ReactElement } from 'react';
import { toast } from 'react-toastify';
import { assign, ContextFrom, DoneInvokeEvent } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { Item } from './Item';
import { Pagination } from './Pagination';
import { Skeleton } from './Skeleton';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  numFound: number;
  hideCheckboxes?: boolean;
  query: IADSApiSearchParams;
}

const defaultProps = {
  docs: [],
  numFound: 0,
  hideCheckboxes: false,
};
const propTypes = {
  docs: PT.arrayOf(PT.object),
  numFound: PT.number,
  hideCheckboxes: PT.bool,
};

const parsePage = (p: string[] | string): number => {
  const page = parseInt(Array.isArray(p) ? p[0] : p, 10);
  return Number.isNaN(page) ? 1 : page;
};

export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const { docs, numFound, hideCheckboxes, query, ...divProps } = props;
  const { api } = useAPI();
  const router = useRouter();
  const {
    query: { p },
  } = router;

  const { basePath } = useBaseRouterPath();
  const [state, send] = useMachine(
    createResultListMachine({
      initialContext: { docs, page: parsePage(p) },
      fetcher: async (ctx) => {
        const result = await api.search.query({
          ...query,
          start: (ctx.page - 1) * 10 + 1,
          rows: 10,
        });

        const url = `${basePath}?${qs.stringify({ p: ctx.page })}`;
        void router.push(url, undefined, { shallow: true });

        return result.match(
          ({ docs }) => docs,
          (e) => {
            toast.error(e.message);
            throw e;
          },
        );
      },
    }),
  );

  const handlePaginationChange = (page: number) => {
    send('updatePage', { page });
  };

  return (
    <article {...divProps} className="flex flex-col mt-1 space-y-1">
      {state.matches('fetching') ? (
        <Skeleton count={10} />
      ) : (
        state.context.docs.map((doc, index) => (
          <Item
            doc={doc}
            key={doc.id}
            index={(state.context.page - 1) * 10 + 1 + index}
            hideCheckbox={hideCheckboxes}
          />
        ))
      )}
      <Pagination totalResults={numFound} numPerPage={10} onPageChange={handlePaginationChange} />
    </article>
  );
};
SimpleResultList.defaultProps = defaultProps;
SimpleResultList.propTypes = propTypes;

interface IResultListMachineContext {
  page: number;
  docs: IDocsEntity[];
}

const createResultListMachine = ({
  fetcher,
  initialContext,
}: {
  fetcher: (ctx: IResultListMachineContext) => Promise<IDocsEntity[]>;
  initialContext: IResultListMachineContext;
}) => {
  const model = createModel(initialContext, {
    events: {
      updatePage: (page: number) => ({ page }),
    },
  });

  return model.createMachine({
    id: 'result-machine',
    initial: 'idle',
    states: {
      idle: {
        initial: 'standby',
        states: {
          standby: {
            on: {
              updatePage: {
                target: '#result-machine.fetching',
                actions: model.assign({ page: (_, ev) => ev.page }),
              },
            },
          },
          hist: { type: 'history', history: 'shallow' },
        },
      },
      fetching: {
        invoke: {
          src: fetcher,
          onDone: {
            target: 'idle.standby',
            actions: assign<ContextFrom<typeof model>, DoneInvokeEvent<IDocsEntity[]>>({
              docs: (_, ev) => ev.data,
            }),
          },
          onError: 'idle.hist',
        },
      },
    },
  });
};
