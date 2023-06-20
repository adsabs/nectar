import { Stack, FormControl, FormLabel, Input, CheckboxGroup, Checkbox } from '@chakra-ui/react';
import { useState } from 'react';
import { AuthorsTable } from './AuthorsTable';
import { IAuthor } from './types';

const collections = [
  { value: 'astronomy', label: 'Astronomy and Astrophysics' },
  { value: 'physics', label: 'Physics and Geophysics' },
  { value: 'general', label: 'General' },
];

export const RecordPanel = ({ record }: { record?: string }) => {
  const [authors, setAuthors] = useState<IAuthor[]>([]);

  const handleAddAuthor = (author: IAuthor) => {
    setAuthors((prev) => [...prev, author]);
  };

  const handleDeleteAuthor = (index: number) => {
    setAuthors((prev) => prev.slice(0, index).concat(prev.slice(index + 1)));
  };

  const handleUpdateAuthor = (index: number, author: IAuthor) => {
    setAuthors((prev) => {
      const ret = [...prev];
      ret[index] = author;
      return ret;
    });
  };

  return (
    <Stack direction="column" gap={2} m={0}>
      <FormControl isRequired>
        <FormLabel>Bibcode</FormLabel>
        <Input />
      </FormControl>
      <FormControl>
        <FormLabel>Collection</FormLabel>
        <CheckboxGroup>
          <Stack direction="row">
            {collections.map((c) => (
              <Checkbox key={`collection-${c.value}`} value={c.value}>
                {c.label}
              </Checkbox>
            ))}
          </Stack>
        </CheckboxGroup>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Title</FormLabel>
        <Input />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Authors</FormLabel>
        <AuthorsTable
          authors={authors}
          onAddAuthor={handleAddAuthor}
          onDeleteAuthor={handleDeleteAuthor}
          onUpdateAuthor={handleUpdateAuthor}
        />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Publications</FormLabel>
      </FormControl>
      <FormControl>
        <FormLabel>URLs</FormLabel>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Abstract</FormLabel>
      </FormControl>
      <FormControl>
        <FormLabel>Keywords</FormLabel>
      </FormControl>
      <FormControl>
        <FormLabel>References</FormLabel>
      </FormControl>
      <FormControl>
        <FormLabel>User Comments</FormLabel>
      </FormControl>
    </Stack>
  );
};
