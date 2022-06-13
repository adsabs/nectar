import { Box, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { ReactElement, useEffect, useState } from 'react';
import { SunburstGraph } from '../Graphs';
import { ISunburstGraph } from '../types';

export interface INetworkGraphPaneProps {
  graph: ISunburstGraph;
  views: IView[];
  onChangeView: (vid: IView['id']) => void;
  defaultView: IView['id'];
}

export interface IView {
  id: string;
  label: string;
}

/**
 *
 * @returns Network graph and its controls
 */
export const NetworkGraphPane = ({ graph, views, onChangeView, defaultView }: INetworkGraphPaneProps): ReactElement => {
  const [view, setView] = useState<IView['id']>(defaultView);

  const handleChangeView = (v: IView['id']) => setView(v);

  useEffect(() => {
    onChangeView(view);
  }, [view]);

  return (
    <Box as="section" aria-label="Author Network" width="100%" mt={5}>
      <RadioGroup defaultChecked onChange={handleChangeView} value={view}>
        <Stack direction="row">
          {views.map((v) => (
            <Radio value={v.id} key={v.id}>
              {v.label}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
      <SunburstGraph graph={graph} />
    </Box>
  );
};
