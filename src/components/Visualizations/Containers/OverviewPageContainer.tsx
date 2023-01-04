import {
  IADSApiSearchParams,
  getSearchFacetYearsParams,
  getSearchFacetReadsParams,
  getSearchFacetCitationsParams,
  useGetSearchFacetCounts,
  useGetSearchFacet,
} from '@api';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  CircularProgress,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@chakra-ui/react';
import { HIndexGraphPane, YearsGraphPane } from '@components';
import { fqNameYearRange } from '@query';
import { Query, removeFQ, setFQ } from '@query-utils';
import { makeSearchParams } from '@utils';
import axios from 'axios';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';
import { FacetField } from '../types';

interface IOverviewPageContainerProps {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (facet: FacetField, cond: string) => void;
}

export const OverviewPageContainer = ({ query, onApplyQueryCondition }: IOverviewPageContainerProps): ReactElement => {
  const router = useRouter();
  const onApplyYearRange = (min: number, max: number) => {
    // Apply year range fq to query
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const cleanedQuery = query.fq ? (removeFQ(fqNameYearRange, query as Query) as IADSApiSearchParams) : query;
    const newQuery = setFQ(fqNameYearRange, `year:${min}-${max}`, cleanedQuery as Query) as IADSApiSearchParams;

    // tigger search
    const search = makeSearchParams({ ...newQuery, p: 1 });
    void router.push({ pathname: '/search', search }, null, { scroll: false, shallow: true });
  };

  const handleApplyCitationCondition = (cond: string) => {
    onApplyQueryCondition('citation_count', cond);
  };

  const handleApplyReadCondition = (cond: string) => {
    onApplyQueryCondition('read_count', cond);
  };

  return (
    <Tabs variant="solid-rounded" isFitted my={10} isLazy={true} lazyBehavior="keepMounted">
      <TabList>
        <Tab>Years</Tab>
        <Tab>Citations</Tab>
        <Tab>Reads</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <YearsTabPane query={query} onApplyYearRange={onApplyYearRange} />
        </TabPanel>
        <TabPanel>
          <CitationTabPane query={query} onApplyQueryCondition={handleApplyCitationCondition} />
        </TabPanel>
        <TabPanel>
          <ReadTabPane query={query} onApplyQueryCondition={handleApplyReadCondition} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

const YearsTabPane = ({
  query,
  onApplyYearRange,
}: {
  query: IADSApiSearchParams;
  onApplyYearRange: (min: number, max: number) => void;
}) => {
  const { data, isLoading, isError, error } = useGetSearchFacetCounts(getSearchFacetYearsParams(query), {
    enabled: !!query && query.q.trim().length > 0,
  });

  return (
    <>
      {isError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching data!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(error) && error.message}</AlertDescription>
        </Alert>
      )}
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && data && <YearsGraphPane data={data} onApplyYearRange={onApplyYearRange} />}
    </>
  );
};

const CitationTabPane = ({
  query,
  onApplyQueryCondition,
}: {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (cond: string) => void;
}) => {
  const { data, isLoading, isError, error } = useGetSearchFacet(getSearchFacetCitationsParams(query), {
    enabled: !!query && query.q.trim().length > 0,
  });

  const handleApplyQueryCondition = (cond: string) => {
    onApplyQueryCondition(cond);
  };

  return (
    <>
      {isError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching data!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(error) && error.message}</AlertDescription>
        </Alert>
      )}
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && data && (
        <HIndexGraphPane
          buckets={data?.facets?.citation_count?.buckets}
          sum={data?.stats?.stats_fields?.citation_count?.sum}
          type="citations"
          onApplyCondition={handleApplyQueryCondition}
        />
      )}
    </>
  );
};

const ReadTabPane = ({
  query,
  onApplyQueryCondition,
}: {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (cond: string) => void;
}) => {
  const { data, isLoading, isError, error } = useGetSearchFacet(getSearchFacetReadsParams(query), {
    enabled: !!query && query.q.trim().length > 0,
  });
  const handleApplyQueryCondition = (cond: string) => {
    onApplyQueryCondition(cond);
  };

  return (
    <>
      {isError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching data!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(error) && error.message}</AlertDescription>
        </Alert>
      )}
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && data && (
        <HIndexGraphPane
          buckets={data?.facets?.read_count?.buckets}
          sum={data?.stats?.stats_fields?.read_count?.sum}
          type="reads"
          onApplyCondition={handleApplyQueryCondition}
        />
      )}
    </>
  );
};
