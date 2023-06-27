import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { Flex, FormControl, FormLabel, HStack, IconButton, Input } from '@chakra-ui/react';
import { Select, SelectOption } from '@components/Select';
import { ChangeEvent, MouseEvent, useState } from 'react';

const relationOptions: SelectOption<string>[] = [
  { id: 'errata', value: 'errata', label: 'Main paper/Errata' },
  { id: 'addenda', value: 'addenda', label: 'Main paper/Addenda' },
  { id: 'series', value: 'series', label: 'Series of Articles' },
  { id: 'arxiv', value: 'arxiv', label: 'arXiv/Published' },
  { id: 'other', value: 'other', label: 'Other' },
];

export const AssociatedTable = () => {
  const [relationType, setRelationType] = useState<SelectOption<string>>(null);
  const [associatedBibcodes, setAssociatedBibcodes] = useState<string[]>([]);
  const [newAssociatedBibcode, setNewAssociatedBibcode] = useState('');

  const handleNewAssociatedBibcodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAssociatedBibcode(e.target.value);
  };

  const handleAddNewAssociatedBibcode = () => {
    setAssociatedBibcodes((prev) => [...prev, newAssociatedBibcode]);
    setNewAssociatedBibcode('');
  };

  const handleEditAssociatedBibcode = (e: ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.dataset['index']);
    setAssociatedBibcodes((prev) => {
      const t = [...prev];
      t[index] = e.target.value;
      return t;
    });
  };

  const handleDeleteAssociatedBibcode = (e: MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset['index']);
    setAssociatedBibcodes((prev) => prev.slice(0, index).concat(prev.slice(index + 1)));
  };

  return (
    <>
      <FormControl isRequired>
        <FormLabel>Relation Type</FormLabel>
        <Select
          options={relationOptions}
          value={relationType}
          name="relation-type"
          label="Relation Type"
          id="relation-options"
          stylesTheme="default"
          onChange={setRelationType}
        />
      </FormControl>
      {relationType !== null && (
        <>
          {relationType.id === 'other' && (
            <FormControl isRequired>
              <FormLabel>Custom Relation Type</FormLabel>
              <Input />
            </FormControl>
          )}
          <FormControl isRequired>
            <FormLabel>{`${
              relationType.id === 'arxiv' ? 'arXiv ' : relationType.id === 'other' ? '' : 'Main paper '
            }Bibcode`}</FormLabel>
            <Input />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{`${
              relationType.id === 'errata'
                ? 'Errata '
                : relationType.id === 'addenda'
                ? 'Addenda '
                : relationType.id === 'series'
                ? 'Series of articles '
                : relationType.id === 'arxiv'
                ? 'Main paper '
                : 'Related '
            }bibcode(s)`}</FormLabel>
            <Flex direction="column" gap={2}>
              {associatedBibcodes.map((b, index) => (
                <HStack key={`asso-bib-${index}`}>
                  <Input value={b} onChange={handleEditAssociatedBibcode} data-index={index} />
                  <IconButton
                    data-index={index}
                    aria-label="Delete"
                    size="md"
                    colorScheme="red"
                    variant="outline"
                    onClick={handleDeleteAssociatedBibcode}
                  >
                    <DeleteIcon />
                  </IconButton>
                </HStack>
              ))}
              <HStack>
                <Input onChange={handleNewAssociatedBibcodeChange} value={newAssociatedBibcode} />
                <IconButton
                  aria-label="Add"
                  variant="outline"
                  size="md"
                  colorScheme="green"
                  onClick={handleAddNewAssociatedBibcode}
                  isDisabled={!newAssociatedBibcode}
                >
                  <AddIcon />
                </IconButton>
              </HStack>
            </Flex>
          </FormControl>
        </>
      )}
    </>
  );
};
