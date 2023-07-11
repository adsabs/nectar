import { SmallCloseIcon } from '@chakra-ui/icons';
import { Button, Flex, Input, Stack, Tag, TagLabel, TagRightIcon } from '@chakra-ui/react';
import { ChangeEvent, useState } from 'react';

export const KeywordList = ({
  keywords,
  onAddKeyword,
  onDeleteKeyword,
}: {
  keywords: string[];
  onAddKeyword: (kw: string) => void;
  onDeleteKeyword: (index: number) => void;
}) => {
  const [newKeyword, setNewKeyword] = useState('');

  // enable add keyword if new keyword is valid
  const isNewKeywordValid = newKeyword.length > 0 && keywords.findIndex((kw) => kw === newKeyword) === -1;

  const handleNewKeywordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewKeyword(e.target.value);
  };

  const handleAddKeyword = () => {
    onAddKeyword(newKeyword);
    setNewKeyword('');
  };

  return (
    <Stack direction="column">
      <Flex direction="row" wrap="wrap" justifyContent="start" rowGap={2}>
        {keywords.map((kw, index) => (
          <Tag key={`keyword-${kw}`} mr={2}>
            <TagLabel>{kw}</TagLabel>
            <TagRightIcon as={SmallCloseIcon} onClick={() => onDeleteKeyword(index)} cursor="pointer" />
          </Tag>
        ))}
      </Flex>
      <Flex direction="row">
        <Input value={newKeyword} onChange={handleNewKeywordChange} />
        <Button
          isDisabled={!isNewKeywordValid}
          onClick={handleAddKeyword}
          size="md"
          borderStartRadius={0}
          borderEndRadius={2}
        >
          Add
        </Button>
      </Flex>
    </Stack>
  );
};
