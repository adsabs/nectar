import { FormControl, FormLabel, Radio, RadioGroup, Stack, Switch } from '@chakra-ui/react';

import { ChangeEvent, ReactElement, useState } from 'react';
import { PaperLimit } from '../Widgets';
import { IView } from './types';
import { AuthorNetworkGraph } from '@/components/Visualizations';
import { IADSApiAuthorNetworkNode, IADSApiAuthorNetworkNodeKey } from '@/api/vis/types';

export interface IAuthorNetworkGraphPaneProps {
  root: IADSApiAuthorNetworkNode;
  linksData: number[][];
  views: IView[];
  onClickNode?: (node: IADSApiAuthorNetworkNode) => void;
  onChangePaperLimit: (limit: number) => void;
  maxPaperLimit: number;
  paperLimit: number;
}
/**
 *
 * @returns Network graph and its controls
 */
export const AuthorNetworkGraphPane = ({
  root,
  linksData,
  views,
  onClickNode,
  onChangePaperLimit: onChangePaperLimit,
  paperLimit,
  maxPaperLimit,
}: IAuthorNetworkGraphPaneProps): ReactElement => {
  const [view, setView] = useState<IView>(views[0]);

  const [showLinkLayer, setShowLinkLayer] = useState(false);

  const handleChangeView = (vid: IView['id']) => setView(views.filter((v) => v.id === vid)[0]);

  const handleChangePaperLimit = (limit: number) => {
    onChangePaperLimit(limit);
  };

  const handleToggleSwitch = () => {
    setShowLinkLayer(!showLinkLayer);
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
      <OverlaySwitch isChecked={showLinkLayer} onChange={handleToggleSwitch} />
      <AuthorNetworkGraph
        root={root}
        linksData={linksData}
        showLinkLayer={showLinkLayer}
        onClickNode={onClickNode}
        keyToUseAsValue={view.valueToUse as IADSApiAuthorNetworkNodeKey}
      />
    </Stack>
  );
};

const OverlaySwitch = ({
  isChecked,
  onChange,
}: {
  isChecked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}): ReactElement => {
  return (
    <FormControl display="flex" alignItems="center">
      <FormLabel htmlFor="overlay" mb="0">
        View link overlay?
      </FormLabel>
      <Switch id="overlay" onChange={onChange} isChecked={isChecked} />
    </FormControl>
  );
};
