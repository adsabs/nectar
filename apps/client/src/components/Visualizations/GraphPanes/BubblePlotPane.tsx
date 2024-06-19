import { Box, Button, Radio, RadioGroup, Stack, Text, VStack } from '@chakra-ui/react';
import { ReactElement, useState } from 'react';
import { BubblePlot, BubblePlotConfig } from '../Graphs/BubblePlot';
import { IBubblePlot, IBubblePlotNodeData } from '../types';

const defaultReadCountConfig: BubblePlotConfig = {
  xKey: 'date',
  yKey: 'read_count',
  rKey: 'citation_count',
  xScaleTypes: ['linear'],
  yScaleTypes: ['log', 'linear'],
  xLabel: 'Date',
  yLabel: '90 Day Read Count',
};

const defaultCitationCountConfig: BubblePlotConfig = {
  xKey: 'date',
  yKey: 'citation_count',
  rKey: 'read_count',
  xScaleTypes: ['linear'],
  yScaleTypes: ['log', 'linear'],
  xLabel: 'Date',
  yLabel: 'Citation Count',
};

const defaultReadCitationConfig: BubblePlotConfig = {
  xKey: 'citation_count',
  yKey: 'read_count',
  rKey: 'year',
  xScaleTypes: ['log', 'linear'],
  yScaleTypes: ['log', 'linear'],
  yLabel: '90 Day Read Count',
  xLabel: 'Citation Count',
};

export interface IBubblePlotPaneProps {
  graph: IBubblePlot;
  onApplyFilter: (nodes: IBubblePlotNodeData[]) => void;
}

type PlotType = 'readTime' | 'citationTime' | 'readCitation';

const plotTypes: { [key in PlotType]: { label: string; config: BubblePlotConfig } } = {
  readTime: { label: 'Read Count vs. Time', config: defaultReadCountConfig },
  citationTime: { label: 'Citation Count vs. Time', config: defaultCitationCountConfig },
  readCitation: { label: 'Read Count vs. Citation Count', config: defaultReadCitationConfig },
};

export const BubblePlotPane = ({ graph, onApplyFilter }: IBubblePlotPaneProps): ReactElement => {
  const [plotType, setPlotType] = useState<PlotType>('readTime');

  const [selectedNodes, setSelectedNodes] = useState<IBubblePlotNodeData[]>([]);

  const handleChangePlotType = (type: PlotType) => {
    setPlotType(type);
  };

  const handleApplyFilter = () => {
    onApplyFilter(selectedNodes);
  };

  const handleNodesSelected = (nodes: IBubblePlotNodeData[]) => {
    setSelectedNodes(nodes);
  };

  return (
    <Box mt={5}>
      <VStack mb={5} alignItems="start">
        <Text fontWeight="bold">Filter current search</Text>
        <Text>
          Select papers on the graph by clicking the nodes or draw rectangle boundary, then apply to filter current
          search. Click the node again to deselect, or double click outside the nodes to deselect all.
        </Text>
        <Button onClick={handleApplyFilter} isDisabled={selectedNodes.length === 0}>
          Search
        </Button>
      </VStack>
      <RadioGroup value={plotType} onChange={handleChangePlotType}>
        <Stack direction="row">
          {Object.entries(plotTypes).map(([k, v]) => (
            <Radio value={k} key={`graph-type-${k}`}>
              {v.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>

      <BubblePlot graph={graph} {...plotTypes[plotType].config} onSelectNodes={handleNodesSelected} />
    </Box>
  );
};
