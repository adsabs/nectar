import { useGetJournal, useGetJournalSummary } from '@/api/journals/journals';
import { useDebounce } from '@/lib/useDebounce';
import { ArrowBackIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  CloseButton,
  Container,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
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
import { ChangeEvent, useMemo, useState } from 'react';

const AbstractPage: NextPage = () => {
  const router = useRouter();

  const [term, setTerm] = useState('');

  const [bibstem, setBibstem] = useState<string>(null);

  const searchTerm = useDebounce(term, 500);

  const { data, isFetching } = useGetJournal({ term: searchTerm }, { enabled: searchTerm.trim() !== '' });

  const handleTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };

  const searchByBibstem = (bibstem: string) => {
    void router.push({ pathname: '/search', query: { q: `bibstem:"${bibstem}"` } });
  };

  return (
    <>
      <Head>
        <title>Journals Database</title>
      </Head>

      <Container maxW="container.xl" my={4} minH="container.sm">
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
              {data.journal.length > 0 && (
                <TableContainer>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Bibstem</Th>
                        <Th>Name</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.journal.map(({ bibstem, name }) => (
                        <Tr>
                          <Td>
                            <Button variant="link" onClick={() => searchByBibstem(bibstem)}>
                              {bibstem}
                            </Button>
                          </Td>
                          <Td>
                            <Button variant="link" onClick={() => setBibstem(bibstem)}>
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
      </Container>
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
      <IconButton icon={<ArrowBackIcon />} aria-label="Clear search" onClick={onClose} />
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

export default AbstractPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
