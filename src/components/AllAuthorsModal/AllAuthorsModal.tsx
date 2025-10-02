import { CloseIcon, DownloadIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { OrcidActiveIcon } from '@/components/icons/Orcid';
import { Pagination } from '@/components/ResultList/Pagination';
import { usePagination } from '@/components/ResultList/Pagination/usePagination';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { useDebounce } from '@/lib/useDebounce';
import { MathJax } from 'better-react-mathjax';
import { saveAs } from 'file-saver';
import { matchSorter } from 'match-sorter';
import { useRouter } from 'next/router';
import {
  ChangeEventHandler,
  forwardRef,
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useGetAuthors } from './useGetAuthors';
import { sendGTMEvent } from '@next/third-parties/google';
import { unwrapStringValue } from '@/utils/common/formatters';
import { useGetAffiliations } from '@/api/search/search';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';

export interface IAllAuthorsModalProps {
  bibcode: IDocsEntity['bibcode'];
  label: ReactNode;
}

export const AllAuthorsModal = ({ bibcode, label }: IAllAuthorsModalProps): ReactElement => {
  const { isOpen, onOpen, onClose } = useDisclosure({
    onOpen() {
      sendGTMEvent({
        event: 'author_list_open',
      });
    },
  });
  const initialRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  // on history change (or url params), close the modal
  useEffect(() => {
    router.events.on('beforeHistoryChange', onClose);
    return () => {
      router.events.off('beforeHistoryChange', onClose);
    };
  }, [onClose, router.events]);

  // to avoid having to play with the forwarded ref, just focus here
  const handleSearchClear = () => {
    if (initialRef.current) {
      initialRef.current.focus();
    }
  };

  // get list of authors/affiliations
  const { data, isSuccess, isFetching } = useGetAffiliations(
    { bibcode },
    {
      enabled: isOpen,
      keepPreviousData: true,
      onError: () => {
        toast({
          title: 'Error',
          description: 'Could not fetch author information, please try again',
          status: 'error',
        });
        onClose();
      },
    },
  );

  return (
    <>
      <Button variant={'link'} fontStyle="italic" onClick={onOpen}>
        {label}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent h="80%">
          <ModalCloseButton />
          <ModalHeader>
            {isSuccess && (
              <Box id="author-list-description">
                <Text size="lg">Author list for </Text>
                <Text
                  size="xl"
                  fontWeight="bold"
                  as={MathJax}
                  dangerouslySetInnerHTML={{
                    __html: unwrapStringValue(data.docs[0].title),
                  }}
                />
              </Box>
            )}
          </ModalHeader>
          <ModalBody px={0}>
            {isFetching && (
              <Flex justifyContent={'center'}>
                <Spinner size="xl" />
              </Flex>
            )}
            {isSuccess && <AuthorsTable doc={data.docs[0]} ref={initialRef} onSearchClear={handleSearchClear} />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const createQuery = (type: 'author' | 'orcid', value: string): IADSApiSearchParams => {
  return { q: `${type}:"${value}"`, sort: ['score desc'] };
};

const AuthorsTable = forwardRef<HTMLInputElement, { doc: IDocsEntity; onSearchClear: () => void }>(
  ({ doc, onSearchClear }, ref) => {
    // process doc (extracts author information)
    const authors = useGetAuthors({ doc });
    const [list, setList] = useState(authors);
    const [searchVal, setSearchVal] = useState('');
    const debSearchVal = useDebounce(searchVal, 500);

    // fill list with authors when it finishes loading
    useEffect(() => setList(authors), [authors]);

    // filter list when searchval changes
    useEffect(
      () =>
        setList(
          debSearchVal === ''
            ? authors
            : matchSorter(authors, debSearchVal, {
                keys: ['1', '2'],
                threshold: matchSorter.rankings.CONTAINS,
              }),
        ),
      [debSearchVal, authors],
    );

    const [{ start, end }, setPagination] = useState({ start: 0, end: 10 });

    const { getPaginationProps } = usePagination({
      numFound: list.length,
      onStateChange: (pagination) => {
        if (pagination.startIndex !== start || pagination.endIndex !== end) {
          setPagination({
            start: pagination.startIndex,
            end: pagination.endIndex,
          });
        }
      },
    });

    // update search val on input change
    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      setSearchVal(e.currentTarget.value);
    };

    // clear input and update list
    const handleInputClear = () => {
      setSearchVal('');
      setList(authors);
      onSearchClear();
    };

    // handle the download button
    const handleDownloadClick: MouseEventHandler = () => {
      const csvBlob = new Blob(
        [
          authors.reduce(
            (acc, [a = '', b = '', c = '', d = '']) => `${acc}"${a}","${b}","${c}","${d}"\n`,
            'position,name,affiliation,orcid\n',
          ),
        ],
        { type: 'text/csv;charset=utf-8' },
      );
      saveAs(csvBlob, `${doc.bibcode}-authors.csv`);
      sendGTMEvent({
        event: 'author_list_export',
      });
    };

    const renderRows = () => {
      return (
        <>
          {list.slice(start, end).map((item, index) => {
            const [position, author, aff, orcid] = item;
            return (
              <Tr key={`${author}${index}`}>
                <Td display={{ base: 'none', sm: 'table-cell' }}>
                  <Text>{position}.</Text>
                </Td>
                <Td>
                  {typeof author === 'string' && (
                    <SearchQueryLink
                      params={createQuery('author', author)}
                      px={1}
                      aria-label={`author "${author}", search by name`}
                      flexShrink="0"
                    >
                      <>{author}</>
                    </SearchQueryLink>
                  )}
                </Td>
                <Td>
                  {typeof orcid === 'string' && (
                    <SearchQueryLink
                      params={createQuery('orcid', orcid)}
                      aria-label={`author "${author}", search by orKid`}
                    >
                      <OrcidActiveIcon fontSize={'large'} />
                    </SearchQueryLink>
                  )}
                </Td>
                <Td>
                  <Text dangerouslySetInnerHTML={{ __html: aff }} />
                </Td>
              </Tr>
            );
          })}
        </>
      );
    };

    return (
      <Box
        as="section"
        aria-describedby="author-list-description"
        position="relative"
        pt="75px"
        overflow="hidden"
        h="100%"
      >
        <Flex
          justifyContent="space-between"
          alignItems="center"
          position="absolute"
          top="0"
          left="0"
          width="100%"
          px={6}
          boxSizing="border-box"
        >
          <InputGroup size="md" width="sm">
            <Input placeholder="Search authors" value={searchVal} onChange={handleInputChange} ref={ref} />
            <InputRightElement>
              <IconButton
                icon={<CloseIcon />}
                variant="unstyled"
                aria-label="clear"
                size="sm"
                hidden={searchVal.length <= 0}
                onClick={handleInputClear}
              />
            </InputRightElement>
          </InputGroup>
          <Tooltip label="Download list as CSV file">
            <IconButton
              icon={<DownloadIcon />}
              size="md"
              ml="4"
              onClick={handleDownloadClick}
              aria-label="Download list as CSV file"
            />
          </Tooltip>
        </Flex>
        <Flex
          direction="column"
          justifyContent="space-between"
          px={6}
          boxSizing="border-box"
          h="100%"
          pb={5}
          overflow="scroll"
        >
          {list.length > 0 && (
            <>
              <Table>
                <Thead>
                  <Tr>
                    <Th display={{ base: 'none', sm: 'table-cell' }} aria-label="position"></Th>
                    <Th w="25%">Name</Th>
                    <Th>ORCiD</Th>
                    <Th w="55%">Affliation</Th>
                  </Tr>
                </Thead>
                <Tbody>{renderRows()}</Tbody>
              </Table>
            </>
          )}
          <Pagination totalResults={list.length} {...getPaginationProps()} perPageMenuPlacement="top" skipRouting />
        </Flex>
      </Box>
    );
  },
);
AuthorsTable.displayName = 'AllAuthorsModal';
