import { Stack, Button, Text } from '@chakra-ui/react';
import { ITagItem, Tags } from '@components/Tags';
import { ReactElement } from 'react';

export const FilterSearchBar = ({
  tagItems,
  onRemove,
  onClear,
  onApply,
  description,
  placeHolder,
}: {
  tagItems: ITagItem[];
  onRemove: (tagItem: ITagItem) => void;
  onClear: () => void;
  onApply: () => void;
  description: string;
  placeHolder: string;
}): ReactElement => {
  return (
    <Stack direction="column" mb={10}>
      <Text fontWeight="bold">Filter current search: </Text>
      <Text>{description}</Text>
      <Tags tagItems={tagItems} onRemove={onRemove} onClear={onClear} placeHolder={placeHolder} flex={1} />
      <Button onClick={onApply}>Search</Button>
    </Stack>
  );
};
