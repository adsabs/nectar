import { Button, Flex, Stack, Text } from '@chakra-ui/react';
import { ITagItem, Tags } from '@/components/Tags';
import { ReactElement } from 'react';

export interface IFilterSearchBarProps {
  tagItems: ITagItem[];
  onRemove: (tagItem: ITagItem) => void;
  onClear: () => void;
  onApply: () => void;
  description: string;
  placeHolder: string;
  direction?: 'row' | 'column';
}

export const FilterSearchBar = ({
  tagItems,
  onRemove,
  onClear,
  onApply,
  description,
  placeHolder,
  direction = 'column',
}: IFilterSearchBarProps): ReactElement => {
  return (
    <Stack direction="column" mb={10}>
      <Text fontWeight="bold">Filter current search: </Text>
      <Text>{description}</Text>
      <Flex direction={direction}>
        <Tags tagItems={tagItems} onRemove={onRemove} onClear={onClear} placeHolder={placeHolder} flex={1} />
        <Button
          onClick={onApply}
          roundedLeft={direction === 'column' ? '-moz-initial' : 'none'}
          size={direction === 'column' ? 'sm' : 'md'}
        >
          Search
        </Button>
      </Flex>
    </Stack>
  );
};
