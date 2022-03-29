import { TabList, Tabs, Tab } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';

// const sections = {
//   overview: {
//     id: 'overview',
//     index: 0,
//     label: 'Overview',
//     path: 'search/overview',
//   },
//   metrics: {
//     id: 'metrics',
//     index: 1,
//     label: 'Metrics',
//     path: 'search/metrics',
//   },
//   author_network: {
//     id: 'author_network',
//     index: 2,
//     label: 'Author Network',
//     path: 'search/author_network',
//   },
//   paper_network: {
//     id: 'paper_network',
//     index: 3,
//     label: 'Paper Network',
//     path: 'search/paper_network',
//   },
//   concept_cloud: {
//     id: 'concept_cloud',
//     index: 4,
//     label: 'Concept Cloud',
//     path: 'search/concept_cloud',
//   },
//   results_graph: {
//     id: 'results_graph',
//     index: 5,
//     label: 'Results Graph',
//     path: 'search/results_graph',
//   },
// };

export type VizSection =
  | 'overview'
  | 'metrics'
  | 'author_network'
  | 'paper_network'
  | 'concept_cloud'
  | 'results_graph';

export const sections: { id: VizSection; index: number; label: string; path: string }[] = [
  {
    id: 'overview',
    index: 0,
    label: 'Overview',
    path: '/search/overview',
  },
  {
    id: 'metrics',
    index: 1,
    label: 'Metrics',
    path: '/search/metrics',
  },
  {
    id: 'author_network',
    index: 2,
    label: 'Author Network',
    path: '/search/author_network',
  },
  {
    id: 'paper_network',
    index: 3,
    label: 'Paper Network',
    path: '/search/paper_network',
  },
  {
    id: 'concept_cloud',
    index: 4,
    label: 'Concept Cloud',
    path: '/search/concept_cloud',
  },
  {
    id: 'results_graph',
    index: 5,
    label: 'Results Graph',
    path: '/search/results_graph',
  },
];

export const VisualizationsTabs = ({ selectedSection }: { selectedSection: VizSection }): ReactElement => {
  const router = useRouter();
  const index = sections.findIndex((section) => section.id === selectedSection);

  const onPageChange = (index: number) => {
    void router.push(sections[index].path);
  };

  return (
    <Tabs index={index} onChange={onPageChange}>
      <TabList>
        {sections.map((section) => (
          <Tab key={section.id}>{section.label}</Tab>
        ))}
      </TabList>
    </Tabs>
  );
};
