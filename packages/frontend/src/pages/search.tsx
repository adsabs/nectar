import AdsApi, {
  IADSApiBootstrapData,
  IADSApiSearchParams,
  IDocsEntity,
} from '@nectar/api';
import { NumFound, ResultList, SearchBar, Sort } from '@nectar/components';
import { rootService, RootTransitionType, searchMachine } from '@nectar/context';
import { useInterpret, useSelector } from '@xstate/react';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

interface ISearchPageProps {
  userData: IADSApiBootstrapData;
  query: string;
  docs: IDocsEntity[];
  meta: {
    numFound: number;
  };
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    userData,
    query = '',
    docs = [],
    meta: { numFound = 0 },
  } = props;
  const service = useInterpret(searchMachine, { devTools: true });
  const { send: rootSend } = rootService;
  const { send } = service;
  const result = useSelector(service, (state) => state.context.result);
  const error = useSelector(service, (state) => state.context.error);
  const isLoading = useSelector(service, (state) => state.matches('fetching'));
  const isFailure = useSelector(service, (state) => state.matches('failure'));

  console.log({ query, docs, numFound });
  console.log({ service: service.state })

  React.useEffect(() => {
    send({ type: 'SET_RESULT', payload: { result: { docs, numFound } } });
  }, [docs, numFound]);

  React.useEffect(() => {
    const { docs, numFound } = result;

    // updates the root context
    rootSend({ type: RootTransitionType.SET_DOCS, payload: { docs } });
    rootSend({ type: RootTransitionType.SET_NUM_FOUND, payload: { numFound } });
    rootSend({
      type: RootTransitionType.SET_USER_DATA,
      payload: { user: userData },
    });
  }, [result]);

  const handleParamsChange = <P extends keyof IADSApiSearchParams>(
    param: P,
    searchOnChange?: boolean,
  ) => (value: IADSApiSearchParams[P]) => {
    send({
      type: 'SET_PARAMS',
      payload: { params: { [param]: value } },
    });
    if (searchOnChange) {
      send({ type: 'SEARCH' });
    }
  };

  return (
    <div className="min-h-screen">
      <h2 className="sr-only">Results</h2>
      <div className="mt-6">
        <SearchBar
          query={query}
          onChange={handleParamsChange<'q'>('q')}
          onSubmit={() => send({ type: 'SEARCH' })}
        />
        {!isLoading &&
          <NumFound count={result.numFound} />
        }
      </div>
      <div className="my-3 flex space-x-2">
        <div className="border rounded-md p-3 bg-white">
          <Sort onChange={handleParamsChange<'sort'>('sort', true)} />
          <div>
            <h3>Selection:</h3>
            <ShowSelection />
          </div>
        </div>
        <div className="flex-grow">
          {isFailure ? (
            <div className="flex flex-col border rounded-md bg-white p-3">
              <h3>Something went wrong with this query!</h3>
              <code>{error.message}</code>
            </div>
          ) : (
            <ResultList
              docs={result.docs as IDocsEntity[]}
              loading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ShowSelection = () => {
  const selectedIds = useSelector(
    rootService,
    (state) => state.context.selectedDocs,
  );
  const docs = useSelector(rootService, (state) => state.context.result.docs);
  console.log({ selectedIds, docs });

  const selectedDocs = docs.filter((doc) => selectedIds.includes(doc.id));

  return (
    <ul>
      {selectedDocs.map(({ id, bibcode }) => (
        <li key={id}>{bibcode}</li>
      ))}
    </ul>
  );
};

export const getServerSideProps: GetServerSideProps<ISearchPageProps> = async (
  ctx,
) => {
  const query: string =
    typeof ctx.query.q === 'string'
      ? ctx.query.q
      : Array.isArray(ctx.query.q)
      ? ctx.query.q.join(' ')
      : '';

  const request = ctx.req as typeof ctx.req & {
    session: { userData: IADSApiBootstrapData };
  };
  const userData = request.session.userData;
  try {
    const adsapi = new AdsApi({ token: userData.access_token });
    const { docs, numFound } = await adsapi.search.query({
      q: query,
      fl: ['bibcode', 'author', 'title', 'pubdate'],
    });

    return {
      props: {
        userData,
        query,
        docs,
        meta: { numFound: numFound },
      },
    };
  } catch (e) {
    return {
      props: {
        userData: {
          username: 'anonymous',
          access_token: '',
          expire_in: '',
          anonymous: true,
        },
        query: '',
        docs: [],
        meta: { numFound: 0 },
      },
    };
  }
};

export default SearchPage;
