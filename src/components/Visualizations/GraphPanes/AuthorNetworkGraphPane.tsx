import { IADSApiAuthorNetworkNode, IADSApiAuthorNetworkNodeKey } from '@api';
import { Radio, RadioGroup, Stack, FormControl, FormLabel, Switch } from '@chakra-ui/react';
import { ChangeEvent, ReactElement, useState } from 'react';
import { AuthorNetworkGraph } from '../Graphs/AuthorNetworkGraph';
import { PaperLimit } from '../Panes';
import { IView } from './types';

export interface IAuthorNetworkGraphPaneProps {
  root: IADSApiAuthorNetworkNode;
  link_data: number[][];
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
  link_data,
  views,
  onClickNode,
  onChangePaperLimit: onChagePaperLimit,
  paperLimit,
  maxPaperLimit,
}: IAuthorNetworkGraphPaneProps): ReactElement => {
  const [view, setView] = useState<IView>(views[0]);

  const [showLinkLayer, setShowLinkLayer] = useState(false);

  const handleChangeView = (vid: IView['id']) => setView(views.filter((v) => v.id === vid)[0]);

  const handleChangePaperLimit = (limit: number) => {
    onChagePaperLimit(limit);
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
        link_data={link_data}
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
