import AdsApi, {
  IADSApiBootstrapData,
  IADSApiSearchParams,
  IDocsEntity,
  SolrSort,
} from '@api';
import { NumFound, ResultList, SearchBar, Sort } from '@components';
import {
  rootInitialContext,
  rootService,
  RootTransitionType,
  SearchMachineTransitionTypes,
  useSearchMachine,
} from '@machines';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import qs from 'qs';
import React from 'react';
import { normalizeURLParams } from '../../utils';

interface ISearchPageProps {
  error?: Error;
  userData: IADSApiBootstrapData;
  params: {
    q: string;
    fl?: string[];
    sort?: SolrSort[];
  };
  docs: IDocsEntity[];
  meta: {
    numFound: number;
  };
}

const SearchPage: NextPage<ISearchPageProps> = (props) => {
  const {
    userData,
    params: { q: query, sort },
    docs = [],
    meta: { numFound = 0 },
  } = props;

  // update the root machine with user data
  React.useEffect(() => {
    rootService.send({
      type: RootTransitionType.SET_USER_DATA,
      payload: { user: userData },
    });
  }, [userData]);

  console.log('params', { props });

  const { service, result, error, isLoading, isFailure } = useSearchMachine({
    initialResult: { docs, numFound },
    initialParams: props.params,
  });
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) {
      const { q, sort } = service.state.context.params;

      void router.push(
        {
          query: qs.stringify({ q, sort }, { indices: false }),
        },
        undefined,
        { shallow: true },
      );
    }
  }, [isLoading]);

  const handleParamsChange = <P extends keyof IADSApiSearchParams>(
    param: P,
  ) => (value: IADSApiSearchParams[P]) => {
    console.log('set params', param, value);
    if (!isLoading) {
      service.send({
        type: SearchMachineTransitionTypes.SET_PARAMS,
        payload: { params: { [param]: value } },
      });
    }
  };

  const handleSubmit = () => {
    service.send({ type: SearchMachineTransitionTypes['SEARCH'] });
  };

  return (
    <form className="min-h-screen" onSubmit={handleSubmit}>
      <h2 className="sr-only">Results</h2>
      <div className="mt-6">
        <SearchBar query={query} onChange={handleParamsChange<'q'>('q')} />
        {!isLoading && <NumFound count={result.numFound} />}
      </div>
      <div className="flex my-3 space-x-2">
        <div className="p-3 bg-white border rounded-md">
          <Sort
            onChange={handleParamsChange<'sort'>('sort')}
            sort={sort ? sort[0] : undefined}
          />
        </div>
        <div className="flex-grow">
          {isFailure ? (
            <div className="flex flex-col p-3 bg-white border rounded-md">
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
    </form>
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
  const params = {
    q: query.q,
    fl: [
      'bibcode',
      'title',
      'author',
      '[fields author=3]',
      'author_count',
      'pubdate',
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);
  if (result.isErr()) {
    return {
      props: {
        error: result.error,
        userData: rootInitialContext.user,
        params: {
          q: '',
          fl: [],
          sort: [],
        },
        docs: [],
        meta: { numFound: 0 },
      },
    };
  }

  const { docs, numFound } = result.value;

  return {
    props: {
      userData,
      params,
      docs,
      meta: { numFound: numFound },
    },
  };
};

export default SearchPage;
