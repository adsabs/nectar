import { useGetISSN, useGetJournal, useGetJournalSummary } from '@/api/journals/journals';
import { IADSApiJournal } from '@/api/journals/types';
import { SimpleLink } from '@/components/SimpleLink';
import { useDebounce } from '@/lib/useDebounce';
import { makeSearchParams } from '@/utils/common/search';
import { ArrowBackIcon, ArrowUpDownIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  CloseButton,
  Container,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ascend, descend, prop, sortWith } from 'ramda';
import { ChangeEvent, useMemo, useState } from 'react';

const AbstractPage: NextPage = () => {
  const [searchType, setSearchType] = useState('journal');

  return (
    <>
      <Head>
        <title>Journals Database</title>
      </Head>
      <Container maxW="container.lg" my={4} minH="container.sm">
        <Heading as="h1">Journals Database</Heading>
        <Text my={4}>
          Search here for a journal, book or conference proceeding to see if it is indexed in SciX. Enter a full or
          partial title for a Journal Search or an ISSN for an ISSN search to get information about the content
          available in SciX.
        </Text>
        <FormControl>
          <Stack direction="row">
            <FormLabel>Search by: </FormLabel>
            <RadioGroup value={searchType} onChange={setSearchType}>
              <Stack direction="row">
                <Radio value="journal">Journal</Radio>
                <Radio value="issn">ISSN</Radio>
              </Stack>
            </RadioGroup>
          </Stack>
        </FormControl>

        {searchType === 'journal' ? <JournalSearch /> : <IssnSearch />}
      </Container>
    </>
  );
};

const JournalSearch = () => {
  const router = useRouter();

  const [term, setTerm] = useState('');

  const [sort, setSort] = useState<{ col: keyof IADSApiJournal; dir: 'asc' | 'desc' }>({
    col: 'bibstem',
    dir: 'asc',
  });

  const [bibstem, setBibstem] = useState<string>(null);

  const searchTerm = useDebounce(term, 500);

  const { data, isFetching } = useGetJournal({ term: searchTerm.trim() }, { enabled: searchTerm.trim() !== '' });

  const handleTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  const sortedJournals = useMemo(() => {
    if (data?.journal) {
      return sortWith([sort.dir === 'asc' ? ascend(prop(sort.col)) : descend(prop(sort.col))], data.journal);
    }
    return [];
  }, [sort, data]);

  return (
    <>
      <InputGroup mt={4}>
        <Input onChange={handleTermChange} value={term} placeholder="type in journal search term" autoFocus />
        <InputRightElement>
          <IconButton icon={<CloseButton />} aria-label="Clear search" onClick={() => setTerm('')} />
        </InputRightElement>
      </InputGroup>
      <Box as="section" mt={4}>
        {isFetching && <Spinner />}
        {bibstem && <JournalSummary bibstem={bibstem} onClose={() => setBibstem(null)} />}
        {!bibstem && !isFetching && data && (
          <>
            <Text size="sm" my={4}>
              <strong>{data.journal.length}</strong> results
            </Text>
            <Text size="sm" my={4}>
              Click on the <i>journal name</i> to get a summary of our holdings. Click on the{' '}
              <i>journal abbreviation</i> to search SciX for records
            </Text>
            {sortedJournals.length > 0 && (
              <TableContainer>
                <Table>
                  <Thead>
                    <Tr>
                      <Th w="5%"></Th>
                      <Th w="15%">
                        Bibstem{' '}
                        {sort.col === 'bibstem' ? (
                          sort.dir === 'asc' ? (
                            <IconButton
                              icon={<TriangleUpIcon />}
                              variant="ghost"
                              size="xs"
                              aria-label="sort descending by bibstem"
                              onClick={() => setSort({ col: 'bibstem', dir: 'desc' })}
                            />
                          ) : (
                            <IconButton
                              icon={<TriangleDownIcon />}
                              variant="ghost"
                              size="xs"
                              aria-label="sort ascending by bibstem"
                              onClick={() => setSort({ col: 'bibstem', dir: 'asc' })}
                            />
                          )
                        ) : (
                          <IconButton
                            icon={<ArrowUpDownIcon />}
                            variant="ghost"
                            size="xs"
                            aria-label="sort by bibstem"
                            onClick={() => setSort({ col: 'bibstem', dir: 'asc' })}
                          />
                        )}
                      </Th>
                      <Th>
                        Name{' '}
                        {sort.col === 'name' ? (
                          sort.dir === 'asc' ? (
                            <IconButton
                              icon={<TriangleUpIcon />}
                              variant="ghost"
                              size="xs"
                              aria-label="sort descending by name"
                              onClick={() => setSort({ col: 'name', dir: 'desc' })}
                            />
                          ) : (
                            <IconButton
                              icon={<TriangleDownIcon />}
                              variant="ghost"
                              size="xs"
                              aria-label="sort ascending by name"
                              onClick={() => setSort({ col: 'name', dir: 'asc' })}
                            />
                          )
                        ) : (
                          <IconButton
                            icon={<ArrowUpDownIcon />}
                            variant="ghost"
                            size="xs"
                            aria-label="sort by name"
                            onClick={() => setSort({ col: 'name', dir: 'asc' })}
                          />
                        )}
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sortedJournals.map(({ bibstem, name }, index) => (
                      <Tr key={bibstem}>
                        <Td>{index + 1}</Td>
                        <Td>
                          <SimpleLink
                            href={`${router.basePath}/search?${makeSearchParams({
                              q: `bibstem:"${bibstem}"`,
                              sort: ['date desc'],
                            })}`}
                            newTab
                            fontWeight="bold"
                          >
                            {bibstem}
                          </SimpleLink>
                        </Td>
                        <Td>
                          <Button
                            variant="link"
                            onClick={() => setBibstem(bibstem)}
                            fontWeight="medium"
                            _hover={{ textDecoration: 'none' }}
                          >
                            {name}
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </>
  );
};

const JournalSummary = ({ bibstem, onClose }: { bibstem: string; onClose: () => void }) => {
  const { data, isFetching } = useGetJournalSummary({ bibstem });

  const summary = useMemo(() => {
    if (data) {
      return JSON.stringify(data.summary, null, 2);
    }
  }, [data]);

  return (
    <>
      <IconButton icon={<ArrowBackIcon />} aria-label="Back" onClick={onClose} />
      <Box as="section" mt={4}>
        {isFetching && <Spinner />}
        {!isFetching && summary && (
          <>
            <Text fontSize="2xl" my={2}>
              <strong>{data.summary.master.bibstem}</strong> {data.summary.master.journal_name}
            </Text>
            <pre>{summary}</pre>
          </>
        )}
      </Box>
    </>
  );
};

const IssnSearch = () => {
  const [term, setTerm] = useState('');

  const [bibstem, setBibstem] = useState<string>(null);

  const { data, isFetching, error } = useGetISSN(
    { issn: term.trim() },
    { enabled: term.trim().length === 9 && term.trim()[4] === '-' },
  );

  const handleTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  return (
    <>
      <InputGroup mt={4}>
        <Input onChange={handleTermChange} value={term} placeholder="type in issn" autoFocus />
        <InputRightElement>
          <IconButton icon={<CloseButton />} aria-label="Clear search" onClick={() => setTerm('')} />
        </InputRightElement>
      </InputGroup>
      <Box as="section" mt={4}>
        {isFetching && <Spinner />}
        {!bibstem && !isFetching && !error && data?.issn && (
          <>
            <Text fontSize="2xl" my={2} fontWeight="bold">
              ISSN: {data.issn.ISSN}
            </Text>
            <pre>{JSON.stringify(data.issn, null, 2)}</pre>
            <Button variant="link" onClick={() => setBibstem(data.issn.bibstem)}>
              View {data.issn.bibstem} details
            </Button>
          </>
        )}
        {!bibstem && !isFetching && !error && data && !data.issn && (
          <>
            <Text fontSize="2xl" my={2} fontWeight="bold">
              Unknown ISSN
            </Text>
          </>
        )}
        {bibstem && <JournalSummary bibstem={bibstem} onClose={() => setBibstem(null)} />}
      </Box>
    </>
  );
};

export default AbstractPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
