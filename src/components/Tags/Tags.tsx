import { Box, BoxProps, Tag, TagCloseButton, TagLabel, Text, Flex, CloseButton } from '@chakra-ui/react';
import { ReactElement, MouseEvent } from 'react';

export interface ITagItem {
  id: string;
  label: string;
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
    <Flex justifyContent="space-between" borderWidth={1} p={2} minH={12} {...boxProps}>
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
