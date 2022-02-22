import { IDocsEntity } from '@api';
import { DownloadIcon } from '@chakra-ui/icons';
import { Box, Grid, GridItem, Link } from '@chakra-ui/layout';
import {
  Button,
  Flex,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { OrcidActiveIcon } from '@components/icons/Orcid';
import { useGetAffiliations } from '@_api/search';
import { matchSorter } from 'match-sorter';
import NextLink from 'next/link';
import { ChangeEventHandler, MouseEventHandler, ReactElement, useCallback, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { useGetAuthors } from './useGetAuthors';

export interface IAllAuthorsModalProps {
  bibcode: IDocsEntity['bibcode'];
  label: string;
}

export const AllAuthorsModal = ({ bibcode, label }: IAllAuthorsModalProps): ReactElement => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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
      q: queryType === 'author' ? `author:${value}` : `orcid:${value}`,
      sort: 'date desc, bibcode desc',
    },
  },
  passHref: true,
});

const AuthorsTable = ({ doc }: { doc: IDocsEntity }): ReactElement => {
  // process doc (extracts author information)
  const authors = useGetAuthors({ doc });
  const [list, setList] = useState(authors);

  // fill list with authors when it finishes loading
  useEffect(() => setList(authors), [authors]);

  // filter the list on search value change
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setList(matchSorter(authors, e.currentTarget.value, { keys: ['1', '2'] }));
  };

  const handleDownloadClick: MouseEventHandler = () => {};

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
                <Link px={1} aria-label={`author ${author}, search by name`} flexShrink="0">
                  {author}
                </Link>
              </NextLink>
            )}
          </GridItem>
          <GridItem colSpan={1}>
            {typeof orcid === 'string' && (
              <NextLink {...getLinkProps('orcid', orcid)}>
                <Link aria-label={`author ${author}, search by orKid`}>
                  <OrcidActiveIcon />
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
    <>
      <Flex justifyContent={'center'}>
        <Input placeholder="Search authors" variant={'filled'} size="md" width="xl" onChange={handleInputChange} />
        <IconButton
          icon={<DownloadIcon />}
          onClick={handleDownloadClick}
          aria-label="download full author list (csv)"
        />
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
    </>
  );
};
