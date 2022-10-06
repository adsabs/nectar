import { Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { ReactElement, useState } from 'react';
import { BubblePlot, BubblePlotConfig, IBubblePlotNodeData } from '../Graphs/BubblePlot';

const defaultReadCountConfig: BubblePlotConfig = {
  xKey: 'date',
  yKey: 'read_count',
  rKey: 'citation_count',
  xScaleType: 'linear',
  yScaleType: 'log',
};

const defaultCitationCountConfig: BubblePlotConfig = {
  xKey: 'date',
  yKey: 'citation_count',
  rKey: 'read_count',
  xScaleType: 'linear',
  yScaleType: 'log',
};

const defaultReadCitationConfig: BubblePlotConfig = {
  xKey: 'citation_count',
  yKey: 'read_count',
  rKey: 'year',
  xScaleType: 'log',
  yScaleType: 'log',
};

export interface IBubblePlotPaneProps {
  nodes: IBubblePlotNodeData[];
  journalNames: string[];
}

type PlotType = 'readTime' | 'citationTime' | 'readCitation';

const plotTypes: { [key in PlotType]: { label: string; config: BubblePlotConfig } } = {
  readTime: { label: 'Read Count vs. Time', config: defaultReadCountConfig },
  citationTime: { label: 'Citation Count vs. Time', config: defaultCitationCountConfig },
  readCitation: { label: 'Read Count vs. Citation Count', config: defaultReadCitationConfig },
};

export const BubblePlotPane = ({ nodes, journalNames }: IBubblePlotPaneProps): ReactElement => {
  const [plotType, setPlotType] = useState<PlotType>('readTime');

  const handleChangePlotType = (type: PlotType) => {
    setPlotType(type);
  };

  return (
    <>
      <RadioGroup value={plotType} onChange={handleChangePlotType}>
        <Stack direction="row">
          {Object.entries(plotTypes).map(([k, v]) => (
            <Radio value={k} key={`graph-type-${k}`}>
              {v.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>

      <BubblePlot nodes={nodes} journalNames={journalNames} {...plotTypes[plotType].config} />
    </>
  );
};
