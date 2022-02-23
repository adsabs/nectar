import { IDocsEntity } from '@api';
import { Link } from '@chakra-ui/layout';
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  Th,
  Thead,
  useDisclosure,
} from '@chakra-ui/react';
import { Table, Tbody, Td, Tr } from '@chakra-ui/table';
import { APP_DEFAULTS } from '@config';
import { searchKeys, useGetAffiliations } from '@_api/search';
import Image from 'next/image';
import NextLink from 'next/link';
import { memo, ReactElement, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useGetAuthors } from './useGetAuthors';

export interface IAllAuthorsModalProps {
  bibcode: IDocsEntity['bibcode'];
  label: string;
}

export const AllAuthorsModal = ({ bibcode, label }: IAllAuthorsModalProps): ReactElement => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const handleLoadMore = () => {
    // cleans out old query from cache
    void queryClient.removeQueries(searchKeys.affiliations({ bibcode, start }));
    setPage(page + 1);
  };
  const start = useMemo(() => page * APP_DEFAULTS.DETAILS_MAX_AUTHORS, [page]);

  // on page change, calculate start

  // get list of authors/affiliations
  const { data, isSuccess, isFetching } = useGetAffiliations(
    { bibcode, start },
    { enabled: isOpen, keepPreviousData: true },
  );

  const hasMore = useMemo(() => {
    if (isSuccess) {
      return start + APP_DEFAULTS.DETAILS_MAX_AUTHORS < data.docs[0].author_count;
    }
  }, [isSuccess, start]);

  return (
    <>
      <Button variant={'link'} fontStyle="italic" onClick={onOpen}>
        {label}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            {isFetching && (
              <Flex justifyContent={'center'}>
                <Spinner size="xl" />
              </Flex>
            )}
            {isSuccess && <AuthorsTable doc={data.docs[0]} />}
            {hasMore && (
              <Flex justifyContent={'center'} mt={2}>
                <Button onClick={handleLoadMore} disabled={isFetching}>
                  {isFetching ? <Spinner size="sm" /> : 'Load More'}
                </Button>
              </Flex>
            )}
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

const AuthorsTable = memo(({ doc }: { doc: IDocsEntity }): ReactElement => {
  // process doc (extracts author information)
  const authors = useGetAuthors({ doc });

  return (
    <Table variant="simple" size="sm">
      <Thead>
        <Tr>
          <Th>Index</Th>
          <Th>Author</Th>
          <Th>Affiliation</Th>
          <Th>ORCiD</Th>
        </Tr>
      </Thead>
      <Tbody>
        {authors.map(([author, aff, orcid], index) => (
          <Tr key={`${author}${index}`}>
            <Td>{index + 1}</Td>
            <Td>
              <NextLink
                href={{
                  pathname: '/search',
                  query: {
                    q: typeof orcid === 'string' ? `orcid:${orcid}` : `author:${author}`,
                    sort: 'date desc, bibcode desc',
                  },
                }}
                passHref
              >
                <Link px={1}>{author}</Link>
              </NextLink>
            </Td>
            <Td dangerouslySetInnerHTML={{ __html: aff }}></Td>
            <Td>
              {typeof orcid === 'string' && (
                <Image src="/images/orcid-active.svg" width="16px" height="16px" alt="Search by ORCID" />
              )}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
});
