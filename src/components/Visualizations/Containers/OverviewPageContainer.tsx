import {
  IADSApiSearchParams,
  getSearchFacetYearsParams,
  getSearchFacetReadsParams,
  getSearchFacetCitationsParams,
  useGetSearchFacetCounts,
  useGetSearchFacet,
} from '@api';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { HIndexGraphPane, YearsGraphPane } from '@components';
import { ReactElement } from 'react';
import { FacetField } from '../types';

interface IOverviewPageContainerProps {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (facet: FacetField, cond: string) => void;
}

export const OverviewPageContainer = ({ query, onApplyQueryCondition }: IOverviewPageContainerProps): ReactElement => {
  const yearsResult = useGetSearchFacetCounts(getSearchFacetYearsParams(query));
  const {
    data: citationData,
    isLoading: citationIsLoading,
    isError: citationIsError,
    error: citationError,
  } = useGetSearchFacet(getSearchFacetCitationsParams(query));
  const {
    data: readData,
    isLoading: readIsLoading,
    isError: readIsError,
    error: readError,
  } = useGetSearchFacet(getSearchFacetReadsParams(query));

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
    <Tabs variant="solid-rounded" isFitted>
      <TabList>
        <Tab>Years</Tab>
        <Tab>Citations</Tab>
        <Tab>Reads</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <YearsGraphPane queryResult={yearsResult} onApplyCondition={handleApplyYearCondition} />
        </TabPanel>
        <TabPanel>
          <HIndexGraphPane
            buckets={citationData?.facets?.citation_count?.buckets}
            sum={citationData?.stats?.stats_fields?.citation_count?.sum}
            type="citations"
            isLoading={citationIsLoading}
            isError={citationIsError}
            error={citationError}
            onApplyCondition={handleApplyCitationCondition}
          />
        </TabPanel>
        <TabPanel>
          <HIndexGraphPane
            buckets={readData?.facets?.read_count?.buckets}
            sum={readData?.stats?.stats_fields?.read_count?.sum}
            type="reads"
            isLoading={readIsLoading}
            isError={readIsError}
            error={readError}
            onApplyCondition={handleApplyReadCondition}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
