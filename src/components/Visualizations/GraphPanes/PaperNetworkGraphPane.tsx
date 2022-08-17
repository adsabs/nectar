import { IADSApiPaperNetworkNodeKey, IADSApiPaperNetworkSummaryGraph, IADSApiPaperNetworkSummaryGraphNode } from '@api';
import { Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { ReactElement, useState } from 'react';
import { PaperNetworkGraph } from '../Graphs';
import { PaperLimit } from '../Panes';
import { IView } from './types';

export interface IPaperNetworkGraphPaneProps {
  nodes_data: IADSApiPaperNetworkSummaryGraph['nodes'];
  links_data: IADSApiPaperNetworkSummaryGraph['links'];
  views: IView[];
  onClickNode?: (node: IADSApiPaperNetworkSummaryGraphNode) => void;
  onChangePaperLimit: (limit: number) => void;
  maxPaperLimit: number;
  paperLimit: number;
}

/**
 *
 * @returns Network graph and its controls
 */
export const PaperNetworkGraphPane = ({
  nodes_data,
  links_data,
  views,
  onClickNode,
  onChangePaperLimit: onChagePaperLimit,
  paperLimit,
  maxPaperLimit,
}: IPaperNetworkGraphPaneProps): ReactElement => {
  const [view, setView] = useState<IView>(views[0]);

  const handleChangeView = (vid: IView['id']) => setView(views.filter((v) => v.id === vid)[0]);

  const handleChangePaperLimit = (limit: number) => {
    onChagePaperLimit(limit);
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
        nodes_data={nodes_data}
        links_data={links_data}
        onClickNode={onClickNode}
        keyToUseAsValue={view.valueToUse as IADSApiPaperNetworkNodeKey}
      />
    </Stack>
  );
};
