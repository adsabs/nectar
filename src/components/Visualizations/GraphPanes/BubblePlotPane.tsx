import { Box, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { ReactElement, useState } from 'react';
import { BubblePlot, BubblePlotConfig } from '../Graphs/BubblePlot';
import { IBubblePlot } from '../types';

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
}

type PlotType = 'readTime' | 'citationTime' | 'readCitation';

const plotTypes: { [key in PlotType]: { label: string; config: BubblePlotConfig } } = {
  readTime: { label: 'Read Count vs. Time', config: defaultReadCountConfig },
  citationTime: { label: 'Citation Count vs. Time', config: defaultCitationCountConfig },
  readCitation: { label: 'Read Count vs. Citation Count', config: defaultReadCitationConfig },
};

export const BubblePlotPane = ({ graph }: IBubblePlotPaneProps): ReactElement => {
  const [plotType, setPlotType] = useState<PlotType>('readTime');

  const handleChangePlotType = (type: PlotType) => {
    setPlotType(type);
  };

  return (
    <Box mt={5}>
      <RadioGroup value={plotType} onChange={handleChangePlotType}>
        <Stack direction="row">
          {Object.entries(plotTypes).map(([k, v]) => (
            <Radio value={k} key={`graph-type-${k}`}>
              {v.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>

      <BubblePlot graph={graph} {...plotTypes[plotType].config} />
    </Box>
  );
};
