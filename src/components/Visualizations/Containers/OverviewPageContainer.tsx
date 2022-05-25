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
import { HIndexGraphPane, YearsGraphPane, FacetField } from '@components';
import axios from 'axios';
import { ReactElement } from 'react';

interface IOverviewPageContainerProps {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (facet: FacetField, cond: string) => void;
}

export const OverviewPageContainer = ({ query, onApplyQueryCondition }: IOverviewPageContainerProps): ReactElement => {
  const handleApplyYearCondition = (cond: string) => {
    onApplyQueryCondition('year', cond);
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
          <YearsTabPane query={query} onApplyQueryCondition={handleApplyYearCondition} />
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
  onApplyQueryCondition,
}: {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (cond: string) => void;
}) => {
  const { data, isLoading, isError, error } = useGetSearchFacetCounts(getSearchFacetYearsParams(query), {
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
      {!isLoading && data && <YearsGraphPane data={data} onApplyCondition={handleApplyQueryCondition} />}
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
