import { SmallCloseIcon } from '@chakra-ui/icons';
import { Button, Flex, FormControl, FormLabel, Input, Stack, Tag, TagLabel, TagRightIcon } from '@chakra-ui/react';
import { ChangeEvent, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormValues } from './types';

export const KeywordsField = () => {
  const {
    fields: keywords,
    append,
    remove,
  } = useFieldArray<FormValues, 'keywords'>({
    name: 'keywords',
  });

  const [newKeyword, setNewKeyword] = useState('');

  // enable add keyword if new keyword is valid
  const isNewKeywordValid = newKeyword.length > 0 && keywords.findIndex((kw) => kw.value === newKeyword) === -1;

  const handleNewKeywordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewKeyword(e.target.value);
  };

  const handleAddKeyword = () => {
    append({ value: newKeyword });
    setNewKeyword('');
  };

  return (
    <FormControl>
      <FormLabel>Keywords</FormLabel>

      <Stack direction="column">
        <Flex direction="row" wrap="wrap" justifyContent="start" rowGap={2}>
          {keywords.map((kw, index) => (
            <Tag key={`keyword-${kw.value}`} mr={2}>
              <TagLabel>{kw.value}</TagLabel>
              <TagRightIcon as={SmallCloseIcon} onClick={() => remove(index)} cursor="pointer" />
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
    </FormControl>
  );
};
