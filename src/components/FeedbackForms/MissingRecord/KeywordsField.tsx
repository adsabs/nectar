import { SmallCloseIcon } from '@chakra-ui/icons';
import { Button, Flex, FormControl, FormLabel, Input, Stack, Tag, TagLabel, TagRightIcon } from '@chakra-ui/react';
import { ChangeEvent, useRef, useState } from 'react';
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

  const inputRef = useRef<HTMLInputElement>();

  // enable add keyword if new keyword is valid
  const isNewKeywordValid = newKeyword.length > 0 && keywords.findIndex((kw) => kw.value === newKeyword) === -1;

  const handleNewKeywordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewKeyword(e.target.value);
  };

  const handleAddKeyword = () => {
    append({ value: newKeyword });
    setNewKeyword('');
    inputRef.current.focus();
  };

  return (
    <FormControl>
      <FormLabel>Keywords</FormLabel>

      <Stack direction="column">
        <Flex direction="row" wrap="wrap" justifyContent="start" rowGap={2}>
          {keywords.map((kw, index) => (
            <Tag key={`keyword-${kw.value}`} mr={2}>
              <TagLabel>{kw.value}</TagLabel>
              <TagRightIcon
                as={SmallCloseIcon}
                onClick={() => remove(index)}
                cursor="pointer"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    remove(index);
                  }
                }}
                aria-label={`remove keyword ${kw.value}`}
              />
            </Tag>
          ))}
        </Flex>
        <Flex direction="row">
          <Input
            value={newKeyword}
            onChange={handleNewKeywordChange}
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isNewKeywordValid) {
                e.preventDefault();
                e.stopPropagation();
                handleAddKeyword();
              }
            }}
          />
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
