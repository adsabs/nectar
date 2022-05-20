import {
  IADSApiSearchParams,
  getSearchFacetYearsParams,
  ISearchStatsFields,
  getSearchFacetReadsParams,
  getSearchFacetCitationsParams,
  useGetSearchFacetCounts,
  useGetSearchFacet,
  IADSApiSearchResponse,
} from '@api';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { UseQueryResult } from 'react-query';
import { CitationsPanel } from './CitationsPane';
import { YearsPanel } from './YearsPane';

interface IOverviewPageContainerProps {
  query: IADSApiSearchParams;
}

export const OverviewPageContainer = ({ query }: IOverviewPageContainerProps): ReactElement => {
  const yearsResult = useGetSearchFacetCounts(getSearchFacetYearsParams(query));
  const citationsStatsResult = useGetSearchFacet(getSearchFacetCitationsParams(query));
  const readsStatsResult = useGetSearchFacet(getSearchFacetReadsParams(query));
  return (
    <Tabs variant="solid-rounded" isFitted>
      <TabList>
        <Tab>Years</Tab>
        <Tab>Citations</Tab>
        <Tab>Reads</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <YearsPanel queryResult={yearsResult}></YearsPanel>
        </TabPanel>
        <TabPanel>
          <CitationsPanel queryResult={citationsStatsResult}></CitationsPanel>
        </TabPanel>
        <TabPanel>
          <ReadsPanel queryResult={readsStatsResult}></ReadsPanel>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

const ReadsPanel = ({ queryResult }: { queryResult: UseQueryResult<IADSApiSearchResponse, unknown> }): ReactElement => {
  return <></>;
};
