import AdsApi, {
  IADSApiBootstrapData,
  IADSApiSearchParams,
  IDocsEntity,
  SolrSort
} from '@nectar/api';
import { NumFound, ResultList, SearchBar, Sort } from '@nectar/components';
import { SearchMachineTransitionTypes, useSearchMachine } from '@nectar/context';
import { GetServerSideProps, NextPage } from 'next';
import Router from 'next/router';
import qs from 'qs';
import React from 'react';
import { normalizeURLParams } from '../utils';

interface ISearchPageProps {
  params: {
    q: string,
    fl?: string[],
    sort?: SolrSort[]
  },
  docs: IDocsEntity[];
  meta: {
    numFound: number;
  };
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    params: {
      q: query,
      sort
    },
    docs = [],
    meta: { numFound = 0 },
  } = props;
  const { service, result, error, isLoading, isFailure } = useSearchMachine({
    initialResult: { docs, numFound },
    initialParams: props.params
  });

  console.log('passed in params', props.params);

  const handleParamsChange = <P extends keyof IADSApiSearchParams>(
    param: P,
    searchOnChange?: boolean,
  ) => (value: IADSApiSearchParams[P]) => {
    service.send({
      type: SearchMachineTransitionTypes.SET_PARAMS,
      payload: { params: { [param]: value } },
    });
    if (searchOnChange) {
      service.send({ type: SearchMachineTransitionTypes.SEARCH });
    }
  };

  const handleSubmit = () => {
    service.send({ type: SearchMachineTransitionTypes.SEARCH });

    // update the URL with the current params
    void Router.push({
      query: qs.stringify(service.state.context.params)
    });
    console.log('query params', qs.stringify(service.state.context.params))
  }

  return (
    <div className="min-h-screen">
      <h2 className="sr-only">Results</h2>
      <div className="mt-6">
        <SearchBar
          query={query}
          onChange={handleParamsChange<'q'>('q')}
          onSubmit={handleSubmit}
        />
        {!isLoading &&
          <NumFound count={result.numFound} />
        }
      </div>
      <div className="my-3 flex space-x-2">
        <div className="border rounded-md p-3 bg-white">
          <Sort onChange={handleParamsChange<'sort'>('sort', true)} sort={sort ? sort[0] : undefined} />
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

export const getServerSideProps: GetServerSideProps<ISearchPageProps> = async (
  ctx,
) => {

  const query = normalizeURLParams(ctx.query);

  const request = ctx.req as typeof ctx.req & {
    session: { userData: IADSApiBootstrapData };
  };
  const userData = request.session.userData;
  try {
    const params = {
      q: query.q,
      fl: ['bibcode', 'author', 'title', 'pubdate'],
      sort: [...query.sort.split(',').map(val => val.split(' ') as SolrSort)]
    };
    const adsapi = new AdsApi({ token: userData.access_token });
    const { docs, numFound } = await adsapi.search.query(params);

    return {
      props: {
        params,
        docs,
        meta: { numFound: numFound },
      },
    };
  } catch (e) {
    console.error(e);
    return {
      props: {
        params: {
          q: '',
          fl: [],
          sort: []
        },
        docs: [],
        meta: { numFound: 0 },
      },
    };
  }
};

export default SearchPage;
