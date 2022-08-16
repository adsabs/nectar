import { IADSApiPaperNetworkNodeKey, IADSApiPaperNetworkSummaryGraph, IADSApiPaperNetworkSummaryGraphNode } from '@api';
import { Radio, RadioGroup, Stack, Text, Input, Button } from '@chakra-ui/react';
import { ChangeEvent, KeyboardEvent, ReactElement, useState } from 'react';
import { PaperNetworkGraph } from '../Graphs';
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
      <LimitPaper initialLimit={paperLimit} max={maxPaperLimit} onApply={handleChangePaperLimit} />
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

const LimitPaper = ({
  initialLimit,
  max,
  onApply,
}: {
  initialLimit: number;
  max: number;
  onApply: (n: number) => void;
}) => {
  const [limit, setLimit] = useState(initialLimit);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLimit(value);
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  const handleApply = () => {
    if (isNaN(limit) || limit < 1 || limit > max) {
      setLimit(initialLimit);
      onApply(initialLimit);
    } else {
      onApply(limit);
    }
  };

  return (
    <Stack direction="row" alignItems="center" my={2}>
      <Text>Show the first</Text>
      <Input w={16} type="number" value={limit} max={max} onChange={handleChange} onKeyDown={handleKeydown} />
      <Text>{`papers (max is ${max})`}</Text>
      <Button onClick={handleApply}>Apply</Button>
    </Stack>
  );
};
