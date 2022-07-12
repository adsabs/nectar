import { Box, Radio, RadioGroup, Stack, Text, Input, Button } from '@chakra-ui/react';
import { ChangeEvent, ReactElement, useEffect, useState } from 'react';
import { SunburstGraph } from '../Graphs';
import { ISunburstGraph, SunburstNode } from '../types';

export interface INetworkGraphPaneProps {
  graph: ISunburstGraph;
  views: IView[];
  onChangeView: (vid: IView['id']) => void;
  defaultView: IView['id'];
  onClickNode?: (node: SunburstNode) => void;
  onChagePaperLimit: (limit: number) => void;
  maxPaperLimit: number;
  paperLimit: number;
}

export interface IView {
  id: string;
  label: string;
}

/**
 *
 * @returns Network graph and its controls
 */
export const NetworkGraphPane = ({
  graph,
  views,
  onChangeView,
  defaultView,
  onClickNode,
  onChagePaperLimit,
  paperLimit,
  maxPaperLimit,
}: INetworkGraphPaneProps): ReactElement => {
  const [view, setView] = useState<IView['id']>(defaultView);

  const handleChangeView = (v: IView['id']) => setView(v);

  const handleChangePaperLimit = (limit: number) => {
    onChagePaperLimit(limit);
  };

  useEffect(() => {
    onChangeView(view);
  }, [view]);

  return (
    <Stack as="section" aria-label="Author Network" width="100%" mt={5}>
      <LimitPaper initialLimit={paperLimit} max={maxPaperLimit} onApply={handleChangePaperLimit} />
      <RadioGroup defaultChecked onChange={handleChangeView} value={view}>
        <Stack direction="row">
          {views.map((v) => (
            <Radio value={v.id} key={v.id}>
              {v.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
      <SunburstGraph graph={graph} onClick={onClickNode} />
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
      <Input w={16} type="number" value={limit} max={max} onChange={handleChange} />
      <Text>{`papers (max is ${max})`}</Text>
      <Button onClick={handleApply}>Apply</Button>
    </Stack>
  );
};
