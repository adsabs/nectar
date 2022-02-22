import { IDocsEntity } from '@api';
import { CloseIcon, DownloadIcon } from '@chakra-ui/icons';
import { Box, Grid, GridItem, Link } from '@chakra-ui/layout';
import {
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
  ModalFooter,
  ModalOverlay,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { OrcidActiveIcon } from '@components/icons/Orcid';
import { useGetAffiliations } from '@_api/search';
import { saveAs } from 'file-saver';
import { matchSorter } from 'match-sorter';
import NextLink from 'next/link';
import {
  ChangeEventHandler,
  forwardRef,
  MouseEventHandler,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { useGetAuthors } from './useGetAuthors';

export interface IAllAuthorsModalProps {
  bibcode: IDocsEntity['bibcode'];
  label: string;
}

export const AllAuthorsModal = ({ bibcode, label }: IAllAuthorsModalProps): ReactElement => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

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
      <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            {isFetching && (
              <Flex justifyContent={'center'}>
                <Spinner size="xl" />
              </Flex>
            )}
            {isSuccess && <AuthorsTable doc={data.docs[0]} ref={initialRef} onSearchClear={handleSearchClear} />}
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

const getLinkProps = (queryType: 'author' | 'orcid', value: string) => ({
  href: {
    pathname: '/search',
    query: {
      q: queryType === 'author' ? `author:"${value}"` : `orcid:"${value}"`,
      sort: 'date desc, bibcode desc',
    },
  },
  passHref: true,
});

const AuthorsTable = forwardRef<HTMLInputElement, { doc: IDocsEntity; onSearchClear: () => void }>(
  ({ doc, onSearchClear }, ref) => {
    // process doc (extracts author information)
    const authors = useGetAuthors({ doc });
    const [list, setList] = useState(authors);
    const [searchVal, setSearchVal] = useState('');

    // fill list with authors when it finishes loading
    useEffect(() => setList(authors), [authors]);

    // filter list when searchval changes
    useEffect(
      () =>
        setList(
          searchVal === ''
            ? authors
            : matchSorter(authors, searchVal, { keys: ['1', '2'], threshold: matchSorter.rankings.WORD_STARTS_WITH }),
        ),
      [searchVal, authors],
    );

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
    };

    const RenderRow = useCallback(
      ({ index, style }: ListChildComponentProps) => {
        const [position, author, aff, orcid] = list[index];
        return (
          <Grid key={`${author}${index}`} style={style} gridTemplateColumns="repeat(12, 1fr)" overflow={'auto'}>
            <GridItem colSpan={1}>
              <Text>{position}.</Text>
            </GridItem>
            <GridItem colSpan={2}>
              {typeof author === 'string' && (
                <NextLink {...getLinkProps('author', author)}>
                  <Link px={1} aria-label={`author "${author}", search by name`} flexShrink="0">
                    {author}
                  </Link>
                </NextLink>
              )}
            </GridItem>
            <GridItem colSpan={1}>
              {typeof orcid === 'string' && (
                <NextLink {...getLinkProps('orcid', orcid)}>
                  <Link aria-label={`author "${author}", search by orKid`}>
                    <OrcidActiveIcon fontSize={'large'} />
                  </Link>
                </NextLink>
              )}
            </GridItem>
            <GridItem colSpan={8}>
              <Text>{aff}</Text>
            </GridItem>
          </Grid>
        );
      },
      [list],
    );

    return (
      <section aria-describedby="author-list-description">
        <Flex justifyContent="center" mb={4}>
          <Text fontSize="lg" fontWeight="bold" id="author-list-description">
            Author list for {doc.bibcode}
          </Text>
        </Flex>
        <Flex justifyContent="center" alignItems="center">
          <InputGroup size="md" width="xl">
            <Input
              placeholder="Filter authors"
              variant={'filled'}
              value={searchVal}
              onChange={handleInputChange}
              ref={ref}
            />
            <InputRightElement>
              <IconButton
                icon={<CloseIcon />}
                variant="outline"
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
              variant={'outline'}
              ml="4"
              onClick={handleDownloadClick}
              aria-label="Download list as CSV file"
            />
          </Tooltip>
        </Flex>
        <Box height="5xl">
          <AutoSizer>
            {({ height, width }) => (
              <Box mt="5">
                <FixedSizeList height={height} width={width} itemCount={list.length} itemSize={65}>
                  {RenderRow}
                </FixedSizeList>
              </Box>
            )}
          </AutoSizer>
        </Box>
      </section>
    );
  },
);
