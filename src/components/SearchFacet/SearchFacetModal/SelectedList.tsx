import { CloseButton, Flex, Tag, TagCloseButton, TagLabel, Wrap } from '@chakra-ui/react';
import { isEmpty } from 'ramda';
import { MouseEventHandler } from 'react';
import { parseRootFromKey, parseTitleFromKey } from '../helpers';
import { IFacetTreeState, useFacetTreeStore } from '../store';

const selectedKeysSelector = (state: IFacetTreeState) => state.selectedKeys;
const resetSelector = (state: IFacetTreeState) => state.reset;
const toggleSelectSelector = (state: IFacetTreeState) => state.toggleSelect;
const formatKeyToName = (key: string) => (key.startsWith('0') ? parseRootFromKey(key) : parseTitleFromKey(key));
export const SelectedList = () => {
  const selected = useFacetTreeStore(selectedKeysSelector);
  const reset = useFacetTreeStore(resetSelector);
  const toggleSelect = useFacetTreeStore(toggleSelectSelector);

  if (isEmpty(selected)) {
    return null;
  }

  const handleDeselect: MouseEventHandler<HTMLButtonElement> = (e) => {
    const { key } = e.currentTarget.dataset;
    toggleSelect(key, key.startsWith('0'));
  };
  const handleDeselectAll = () => reset();

  return (
    <Flex
      direction="row"
      border="inset 1px"
      borderColor="gray.100"
      p="1"
      mt="2"
      alignItems="center"
      borderRadius="md"
      maxHeight="64"
      overflowY="scroll"
    >
      <Wrap flex="1" spacing="1">
        {selected.map((key) => (
          <Tag key={key} size="sm" variant="subtle">
            <TagLabel>{formatKeyToName(key)}</TagLabel>
            <TagCloseButton onClick={handleDeselect} data-key={key} />
          </Tag>
        ))}
      </Wrap>
      <CloseButton onClick={handleDeselectAll} />
    </Flex>
  );
};
