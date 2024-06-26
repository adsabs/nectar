import { BoxProps, Flex, IconButton, Tag, TagCloseButton, TagLabel, Wrap } from '@chakra-ui/react';
import { useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { isEmpty } from 'ramda';
import { MouseEventHandler } from 'react';
import { getObjectName, parseRootFromKey, parseTitleFromKey } from '../helpers';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useQueryClient } from '@tanstack/react-query';

const formatKeyToName = (key: string) => (key.startsWith('0') ? parseRootFromKey(key) : parseTitleFromKey(key));

export const SelectedList = (props: BoxProps) => {
  const selected = useFacetStore((state) => state.selected);
  const select = useFacetStore((state) => state.select);
  const clearSelection = useFacetStore((state) => state.clearSelection);
  const facetId = useFacetStore((state) => state.params.field);

  const queryClient = useQueryClient();

  if (isEmpty(selected)) {
    return null;
  }

  const handleDeselect: MouseEventHandler<HTMLButtonElement> = (e) => {
    const { key } = e.currentTarget.dataset;
    select(key);
  };

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
      w="full"
      {...props}
    >
      <Wrap flex="1" spacing="1">
        {selected.map((key) => (
          <Tag key={key} size="sm" variant="subtle">
            <TagLabel>
              {facetId === 'simbad_object_facet_hier' && key.startsWith('1/')
                ? getObjectName(formatKeyToName(key), queryClient)
                : formatKeyToName(key)}
            </TagLabel>
            <TagCloseButton
              onClick={handleDeselect}
              data-key={key}
              aria-label={`remove ${formatKeyToName(key)} from selection`}
            />
          </Tag>
        ))}
      </Wrap>
      <IconButton
        aria-label={`clear all selection`}
        onClick={clearSelection}
        variant="ghost"
        size="xs"
        colorScheme="blackAlpha"
        icon={<XMarkIcon />}
      />
    </Flex>
  );
};
