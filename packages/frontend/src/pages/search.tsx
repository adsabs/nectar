import AdsApi, { IADSApiBootstrapData, IADSApiSearchParams, IDocsEntity } from '@nectar/api';
import { NumFound, ResultList, SearchBar, Sort } from '@nectar/components';
import { SearchMachine } from '@nectar/context';
import { useMachine } from '@xstate/react';
import { GetServerSideProps, NextPage } from 'next';
import React from 'react';

interface ISearchPageProps {
  query: string;
  docs: IDocsEntity[];
  meta: {
    numFound: number;
  };
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    query = '',
    docs = [],
    meta: { numFound = 0 },
  } = props;

  console.log({ query, docs, numFound })

  const [searchMachineCurrent, searchMachineSend] = useMachine(SearchMachine);

  React.useEffect(() => {
    searchMachineSend({
      type: 'SET_RESULT',
      payload: { result: { docs, numFound } },
    });
  }, [docs, numFound]);

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submit');
    searchMachineSend('SEARCH');
  };

  const handleParamsChange = <P extends keyof IADSApiSearchParams>(
    param: P,
    searchOnChange?: boolean,
  ) => (value: IADSApiSearchParams[P]) => {
    console.log('change', param, value);
    searchMachineSend({
      type: 'SET_PARAMS',
      payload: { params: { [param]: value } },
    });
    if (searchOnChange) {
      searchMachineSend('SEARCH');
    }
  };

  const handleSelectedItemChange = (items: IDocsEntity['id'][]) => {
    console.log('selected', items);
  };

  const { context, value: state } = searchMachineCurrent;
  return (
    <div className="min-h-screen">
      <h2 className="sr-only">Results</h2>
      <code>
        {JSON.stringify(
          {
            params: context.params,
            numFound: context.result.numFound,
            error: context.error.message,
            state,
          },
          null,
          2,
        )}
      </code>
      <form
        action="/search"
        method="get"
        className="mt-6"
        onSubmit={handleSubmit}
      >
        <SearchBar query={query} onChange={handleParamsChange<'q'>('q')} />
        <NumFound count={searchMachineCurrent.context.result.numFound} />
      </form>
      <div className="my-3 flex space-x-2">
        <div className="border rounded-md p-3 bg-white">
          <Sort onChange={handleParamsChange<'sort'>('sort', true)} />
        </div>
        <div className="flex-grow">
          {searchMachineCurrent.matches('failure') ? (
            <div className="flex flex-col border rounded-md bg-white p-3">
              <h3>Something went wrong with this query!</h3>
              <code>{searchMachineCurrent.context.error.message}</code>
            </div>
          ) : (
            <ResultList
              docs={searchMachineCurrent.context.result.docs as IDocsEntity[]}
              loading={searchMachineCurrent.matches('fetching')}
              selected={[]}
              onSelectedChange={handleSelectedItemChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<ISearchPageProps> = async (
  ctx,
) => {
  console.log('GET SERVER SIDE PROPS')

  const query: string =
    typeof ctx.query.q === 'string'
      ? ctx.query.q
      : Array.isArray(ctx.query.q)
        ? ctx.query.q.join(' ')
        : '';

  const request = ctx.req as typeof ctx.req & { session: { userData: IADSApiBootstrapData } };
  const userData = request.session.userData;
  console.log('dsflkj =- ', userData);

  try {
    const adsapi = new AdsApi({ token: userData.access_token });
    const { docs, numFound } = await adsapi.search.query({
      q: query,
      fl: ['bibcode', 'author', 'title', 'pubdate'],
    });

    console.log('###query###', { query, numFound, docs })

    return {
      props: {
        query,
        docs,
        meta: { numFound: numFound },
      },
    };
  } catch (e) {
    return {
      props: {
        query: '',
        docs: [],
        meta: { numFound: 0 },
      },
    };
  }
};

export default SearchPage;
