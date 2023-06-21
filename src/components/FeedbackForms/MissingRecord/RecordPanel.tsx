import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  CheckboxGroup,
  Checkbox,
  HStack,
  Textarea,
  Button,
  Flex,
  useCheckboxGroup,
} from '@chakra-ui/react';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import { ChangeEvent, useState } from 'react';
import { KeywordList, ReferencesTable } from '.';
import { AuthorsTable } from './AuthorsTable';
import { IAuthor, IReference, IUrl } from './types';
import { URLTable } from './URLTable';

const collections = [
  { value: 'astronomy', label: 'Astronomy and Astrophysics' },
  { value: 'physics', label: 'Physics and Geophysics' },
  { value: 'general', label: 'General' },
];

const datePropConfig = {
  dateNavBtnProps: {
    variant: 'outline',
  },
  dayOfMonthBtnProps: {
    defaultBtnProps: {
      borderColor: 'red.300',
      _hover: {
        background: 'blue.400',
      },
    },
    selectedBtnProps: {
      background: 'blue.200',
      borderColor: 'blue.300',
      color: 'blue.600',
    },
    todayBtnProps: {
      variant: 'outline',
    },
  },
};

export const RecordPanel = ({ isNew }: { isNew: boolean }) => {
  const [record, setRecord] = useState<string>(null);
  const [recordLoaded, setRecordLoaded] = useState(false);
  const [authors, setAuthors] = useState<IAuthor[]>([]);
  const [pubDate, setPubDate] = useState(new Date());
  const [urls, setUrls] = useState<IUrl[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [references, setReferences] = useState<IReference[]>([]);

  const handleRecordFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRecord(e.target.value);
  };

  // authors

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

  // urls

  const handleAddUrl = (url: IUrl) => {
    setUrls((prev) => [...prev, url]);
  };

  const handleDeleteUrl = (index: number) => {
    setUrls((prev) => prev.slice(0, index).concat(prev.slice(index + 1)));
  };

  const handleUpdateUrl = (index: number, url: IUrl) => {
    setUrls((prev) => {
      const ret = [...prev];
      ret[index] = url;
      return ret;
    });
  };

  // keywords

  const handleAddKeyword = (keyword: string) => {
    setKeywords((prev) => [...prev, keyword]);
  };

  const handleDeleteKeyword = (keyword: string) => {
    setKeywords((prev) => prev.filter((kw) => kw !== keyword));
  };

  // references

  const handleAddReference = (reference: IReference) => {
    setReferences((prev) => [...prev, reference]);
  };

  const handleDeleteReference = (index: number) => {
    setReferences((prev) => prev.slice(0, index).concat(prev.slice(index + 1)));
  };

  const handleUpdateReference = (index: number, reference: IReference) => {
    setReferences((prev) => {
      const ret = [...prev];
      ret[index] = reference;
      return ret;
    });
  };

  return (
    <Stack direction="column" gap={2} m={0}>
      <FormControl isRequired>
        <FormLabel>Bibcode</FormLabel>
        <Flex direction="row">
          <Input value={record} onChange={handleRecordFieldChange} />
          {!isNew && (
            <Button size="md" borderStartRadius={0} borderEndRadius={2} isDisabled={!record || record.length === 0}>
              Load
            </Button>
          )}
        </Flex>
      </FormControl>
      {(isNew || (!isNew && recordLoaded)) && (
        <>
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
          <HStack gap={2}>
            <FormControl isRequired>
              <FormLabel>Publications</FormLabel>
              <Input />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Publication Date</FormLabel>
              <SingleDatepicker date={pubDate} onDateChange={setPubDate} propsConfigs={datePropConfig} />
            </FormControl>
          </HStack>
          <FormControl>
            <FormLabel>URLs</FormLabel>
            <URLTable urls={urls} onAddUrl={handleAddUrl} onDeleteUrl={handleDeleteUrl} onUpdateUrl={handleUpdateUrl} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Abstract</FormLabel>
            <Textarea />
          </FormControl>
          <FormControl>
            <FormLabel>Keywords</FormLabel>
            <KeywordList keywords={keywords} onAddKeyword={handleAddKeyword} onDeleteKeyword={handleDeleteKeyword} />
          </FormControl>
          <FormControl>
            <FormLabel>References</FormLabel>
            <ReferencesTable
              references={references}
              onAddReference={handleAddReference}
              onDeleteReference={handleDeleteReference}
              onUpdateReference={handleUpdateReference}
            />
          </FormControl>
          <FormControl>
            <FormLabel>User Comments</FormLabel>
            <Textarea />
          </FormControl>
        </>
      )}
    </Stack>
  );
};
