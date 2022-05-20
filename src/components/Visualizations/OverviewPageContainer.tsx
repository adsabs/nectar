import {
  getSearchStatsCitationsParams,
  getSearchStatsReadsParams,
  IADSApiSearchParams,
  useGetSearchStats,
  getSearchFacetYearsParams,
  useGetSearchFacet,
  ISearchStatsFields,
} from '@api';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { UseQueryResult } from 'react-query';
import { YearsPanel } from './YearsPane';

interface IOverviewPageContainerProps {
  query: IADSApiSearchParams;
}

export const OverviewPageContainer = ({ query }: IOverviewPageContainerProps): ReactElement => {
  const yearsResult = useGetSearchFacet(getSearchFacetYearsParams(query));
  const citationsStatsResult = useGetSearchStats(getSearchStatsCitationsParams(query));
  const readsStatsResult = useGetSearchStats(getSearchStatsReadsParams(query));
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

const CitationsPanel = ({
  queryResult,
}: {
  queryResult: UseQueryResult<ISearchStatsFields, unknown>;
}): ReactElement => {
  return <></>;
};

const ReadsPanel = ({ queryResult }: { queryResult: UseQueryResult<ISearchStatsFields, unknown> }): ReactElement => {
  return <></>;
};
