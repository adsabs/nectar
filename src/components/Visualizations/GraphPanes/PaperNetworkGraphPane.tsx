import { Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { ReactElement, useState } from 'react';
import { PaperNetworkGraph } from '../Graphs';
import { PaperLimit } from '../Widgets';
import { IView } from './types';
import {
  IADSApiPaperNetworkNodeKey,
  IADSApiPaperNetworkSummaryGraph,
  IADSApiPaperNetworkSummaryGraphNode,
} from '@/api/vis/types';

export interface IPaperNetworkGraphPaneProps {
  nodesData: IADSApiPaperNetworkSummaryGraph['nodes'];
  linksData: IADSApiPaperNetworkSummaryGraph['links'];
  views: IView[];
  onClickNode?: (node: IADSApiPaperNetworkSummaryGraphNode) => void;
  onClickLink: (
    source: IADSApiPaperNetworkSummaryGraphNode,
    sourceColor: string,
    target: IADSApiPaperNetworkSummaryGraphNode,
    targetColor: string,
  ) => void;
  onChangePaperLimit: (limit: number) => void;
  maxPaperLimit: number;
  paperLimit: number;
}

/**
 *
 * @returns Network graph and its controls
 */
export const PaperNetworkGraphPane = ({
  nodesData,
  linksData,
  views,
  onClickNode,
  onClickLink,
  onChangePaperLimit: onChangePaperLimit,
  paperLimit,
  maxPaperLimit,
}: IPaperNetworkGraphPaneProps): ReactElement => {
  const [view, setView] = useState<IView>(views[0]);

  const handleChangeView = (vid: IView['id']) => setView(views.filter((v) => v.id === vid)[0]);

  const handleChangePaperLimit = (limit: number) => {
    onChangePaperLimit(limit);
  };

  return (
    <Stack as="section" aria-label="Author Network" width="100%" mt={5}>
      <PaperLimit initialLimit={paperLimit} max={maxPaperLimit} onApply={handleChangePaperLimit} />
      <RadioGroup defaultChecked onChange={handleChangeView} value={view.id}>
        <Stack direction="row">
          {views.map((v) => (
            <Radio value={v.id} key={v.id}>
              {v.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
      <PaperNetworkGraph
        nodesData={nodesData}
        linksData={linksData}
        onClickNode={onClickNode}
        onClickLink={onClickLink}
        keyToUseAsValue={view.valueToUse as IADSApiPaperNetworkNodeKey}
      />
    </Stack>
  );
};
