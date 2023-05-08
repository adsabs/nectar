import { Box, BoxProps, CloseButton, Flex, Tag, TagCloseButton, TagLabel, Text } from '@chakra-ui/react';
import { MouseEvent, ReactElement } from 'react';

export interface ITagItem {
  id: string | number;
  label: string | number;
}

export interface ITagsProps extends BoxProps {
  tagItems: ITagItem[];
  onRemove: (item: ITagItem) => void;
  onClear: () => void;
  placeHolder?: string;
}

export const Tags = ({ tagItems, onRemove, onClear, placeHolder, ...boxProps }: ITagsProps): ReactElement => {
  const handleRemoveItem = (e: MouseEvent<HTMLButtonElement>) => {
    const item = tagItems.find((t) => t.id === e.currentTarget.dataset.id);
    onRemove(item);
  };

  const handleRemoveAllItems = () => {
    onClear();
  };

  return (
    <Flex justifyContent="space-between" alignItems="center" borderWidth={1} px={2} {...boxProps}>
      <Box>
        {tagItems.length === 0 && placeHolder ? <Text color="gray.300">{placeHolder}</Text> : null}
        {tagItems.map((item) => (
          <Tag key={`tag-${item.id}`} size="md" m={1}>
            <TagLabel>{item.label}</TagLabel>
            <TagCloseButton onClick={handleRemoveItem} data-id={item.id} />
          </Tag>
        ))}
      </Box>
      <CloseButton onClick={handleRemoveAllItems} />
    </Flex>
  );
};
