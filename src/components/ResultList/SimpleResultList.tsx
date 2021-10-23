import { IADSApiSearchParams, IDocsEntity } from '@api';
import { useAPI } from '@hooks';
import { useMachine } from '@xstate/react';
import { useRouter } from 'next/router';
import PT from 'prop-types';
import qs from 'qs';
import React, { HTMLAttributes, ReactElement } from 'react';
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
export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const { docs, numFound, hideCheckboxes, query, ...divProps } = props;
  const { api } = useAPI();
  const router = useRouter();
  const [state, send] = useMachine(
    createResultListMachine({
      initialContext: { docs, page: 1 },
      fetcher: async (ctx) => {
        const result = await api.search.query({
          ...query,
          start: (ctx.page - 1) * 10 + 1,
          rows: 10,
        });
        const url = `${router.asPath}?${qs.stringify({ p: ctx.page })}`;
        void router.push(url, undefined, { shallow: true });

        return result.match(
          ({ docs }) => docs,
          (e) => {
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
        on: {
          updatePage: {
            target: 'fetching',
            actions: model.assign({ page: (_, ev) => ev.page }),
          },
        },
      },
      fetching: {
        invoke: {
          src: fetcher,
          onDone: {
            target: 'idle',
            actions: assign<ContextFrom<typeof model>, DoneInvokeEvent<IDocsEntity[]>>({
              docs: (_, ev) => ev.data,
            }),
          },
        },
      },
    },
  });
};
