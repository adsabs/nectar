import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Tooltip,
  Tr,
  useDisclosure,
  VisuallyHidden,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';

import { createUrlByType } from '@/components/AbstractSources/linkGenerator';
import { IAllAuthorsModalProps } from '@/components/AllAuthorsModal';
import { useGetAuthors } from '@/components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@/components/icons/Orcid';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { APP_DEFAULTS, EXTERNAL_URLS } from '@/config';
import { useIsClient } from '@/lib/useIsClient';
import { composeNextGSSP } from '@/ssr-utils';
import { MathJax } from 'better-react-mathjax';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import { equals, isNil, path, values } from 'ramda';
import { memo, ReactElement, useState } from 'react';
import { useRouter } from 'next/router';
import { FolderPlusIcon } from '@heroicons/react/24/solid';
import { useSession } from '@/lib/useSession';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { isNilOrEmpty } from 'ramda-adjunct';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';
import { SimpleLink } from '@/components/SimpleLink';
import { feedbackItems } from '@/components/NavBar';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { AbstractSources } from '@/components/AbstractSources';
import { AddToLibraryModal } from '@/components/Libraries';
import { SimpleCopyButton } from '@/components/CopyButton';

import { pluralize } from '@/utils/common/formatters';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { fetchSearchSSR, searchKeys, useGetAbstract } from '@/api/search/search';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { getAbstractParams } from '@/api/search/models';
import { useGetExportCitation } from '@/api/export/export';
import { citationFormats, ExportFormat } from '@/components/CitationExporter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { Select } from '@/components/Select';
import { LoadingMessage } from '@/components/Feedbacks';
import { useSettings } from '@/lib/useSettings';

const AllAuthorsModal = dynamic<IAllAuthorsModalProps>(
  () =>
    import('@/components/AllAuthorsModal').then((m) => ({
      default: m.AllAuthorsModal,
    })),
  { ssr: false },
);

const MAX = APP_DEFAULTS.DETAILS_MAX_AUTHORS;

const createQuery = (type: 'author' | 'orcid', value: string): IADSApiSearchParams => {
  return { q: `${type}:"${value}"`, sort: ['score desc'] };
};

const AbstractPage: NextPage = () => {
  const router = useRouter();
  const isClient = useIsClient();
  const { isAuthenticated } = useSession();
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data);

  // process authors from doc
  const authors = useGetAuthors({ doc, includeAff: false });
  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  const handleFeedback = () => {
    void router.push({ pathname: feedbackItems.record.path, query: { bibcode: doc.bibcode } });
  };

  return (
    <AbsLayout doc={doc} titleDescription={''} label="Abstract">
      <Box as="article" aria-labelledby="title">
        {doc && (
          <Stack direction="column" gap={2}>
            {isClient ? (
              <Flex wrap="wrap" as="section" aria-labelledby="author-list">
                <VisuallyHidden as="h2" id="author-list">
                  Authors
                </VisuallyHidden>
                {authors.map(([, author, orcid], index) => (
                  <Box mr={1} key={`${author}-${index}`}>
                    <SearchQueryLink
                      params={createQuery('author', author)}
                      px={1}
                      aria-label={`author "${author}", search by name`}
                      flexShrink="0"
                    >
                      <>{author}</>
                    </SearchQueryLink>
                    {typeof orcid === 'string' && (
                      <SearchQueryLink
                        params={createQuery('orcid', orcid)}
                        aria-label={`author "${author}", search by orKid`}
                      >
                        <OrcidActiveIcon fontSize={'large'} mx={1} />
                      </SearchQueryLink>
                    )}
                    <>{index === MAX - 1 || index === doc.author_count - 1 ? '' : ';'}</>
                  </Box>
                ))}
                {doc.author_count > MAX ? (
                  <AllAuthorsModal bibcode={doc.bibcode} label={`and ${doc.author_count - MAX} more`} />
                ) : (
                  <>{doc.author_count > 0 && <AllAuthorsModal bibcode={doc.bibcode} label={'show details'} />}</>
                )}
              </Flex>
            ) : (
              <Flex wrap="wrap">
                {doc?.author?.map((author, index) => (
                  <SearchQueryLink
                    params={createQuery('author', author)}
                    key={`${author}-${index}`}
                    px={1}
                    aria-label={`author "${author}", search by name`}
                    flexShrink="0"
                  >
                    <>{author}</>
                  </SearchQueryLink>
                ))}
                {doc?.author_count > MAX ? <Text>{` and ${doc?.author_count - MAX} more`}</Text> : null}
              </Flex>
            )}

            <Flex justifyContent="space-between">
              <Box display={{ base: 'block', lg: 'none' }}>
                <AbstractSources doc={doc} style="menu" />
              </Box>
              <Flex>
                {isAuthenticated && (
                  <Tooltip label="add to library">
                    <IconButton
                      aria-label="Add to library"
                      icon={<FolderPlusIcon />}
                      variant="ghost"
                      onClick={onOpenAddToLibrary}
                    />
                  </Tooltip>
                )}
              </Flex>
            </Flex>

            <Box as="section" py="2" aria-labelledby="abstract">
              <VisuallyHidden as="h2" id="abstract">
                Abstract
              </VisuallyHidden>
              {isNil(doc?.abstract) ? (
                <Text>No Abstract</Text>
              ) : (
                <Text as={MathJax} dangerouslySetInnerHTML={{ __html: doc.abstract }} />
              )}
            </Box>
            <Details doc={doc} />
            <Flex justifyContent="end">
              <Button variant="link" size="sm" onClick={handleFeedback}>
                <EditIcon mr={2} /> Make Corrections
              </Button>
            </Flex>
          </Stack>
        )}
      </Box>
      <AddToLibraryModal isOpen={isAddToLibraryOpen} onClose={onCloseAddToLibrary} bibcodes={[doc?.bibcode]} />
    </AbsLayout>
  );
};

export default AbstractPage;

interface IDetailsProps {
  doc: IDocsEntity;
}
const Details = ({ doc }: IDetailsProps): ReactElement => {
  const arxiv = (doc.identifier ?? ([] as string[])).find((v) => /^arxiv/i.exec(v));

  const { isOpen: isCitationOpen, onOpen: onCitationOpen, onClose: onCitationClose } = useDisclosure();

  return (
    <Box as="section" border="1px" borderColor="gray.50" borderRadius="md" shadow="sm" aria-labelledby="details">
      <VisuallyHidden as="h2" id="details">
        Details
      </VisuallyHidden>
      <Table colorScheme="gray" size="md" role="presentation">
        <Tbody>
          <Detail label="Publication" value={doc.pub_raw}>
            {(pub_raw) => (
              <>
                <span dangerouslySetInnerHTML={{ __html: pub_raw }}></span>
                <Tooltip label="copy citation">
                  <Button
                    aria-label="Copy citation"
                    variant="outline"
                    mx={2}
                    cursor="pointer"
                    size="xs"
                    onClick={onCitationOpen}
                  >
                    <FontAwesomeIcon icon={faQuoteLeft} size="xs" />
                  </Button>
                </Tooltip>
              </>
            )}
          </Detail>
          <Detail label="Book Author(s)" value={doc.book_author} />
          <Detail label="Publication Date" value={doc.pubdate} />
          <Detail label="DOI" value={doc.doi}>
            {(doi) => <Doi doiIDs={doi} bibcode={doc.bibcode} />}
          </Detail>
          <Detail
            label="arXiv"
            value={arxiv}
            href={createUrlByType(doc?.bibcode, 'arxiv', arxiv?.split(':')[1])}
            newTab
          />
          <Detail label="Bibcode" value={doc.bibcode} copiable />
          <Keywords keywords={doc.keyword} />
          <UATKeywords keywords={doc.uat} ids={doc.uat_id} />
          <PlanetaryFeatures features={doc.planetary_feature} ids={doc.planetary_feature_id} />
          <Detail label="Comment(s)" value={doc.comment} />
          <Detail label="E-Print Comment(s)" value={doc.pubnote} />
        </Tbody>
      </Table>
      <CitationModal isOpen={isCitationOpen} onClose={onCitationClose} bibcode={doc?.bibcode} />
    </Box>
  );
};

const CitationModal = ({ isOpen, onClose, bibcode }: { isOpen: boolean; onClose: () => void; bibcode: string }) => {
  const { settings } = useSettings();

  const options = values(citationFormats);

  const defaultOption = settings.defaultCitationFormat
    ? options.find((option) => option.value === settings.defaultCitationFormat)
    : options.find((option) => option.id === 'agu');

  const [selectedOption, setSelectedOption] = useState(defaultOption);

  const { data, isLoading, isError, error } = useGetExportCitation(
    {
      format: selectedOption.id as ExportFormat['id'],
      bibcode: [bibcode],
    },
    { enabled: !!bibcode && isOpen },
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Citation</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Select
            name="format"
            label="Citation Format"
            hideLabel
            id="citation-format-selector"
            options={options}
            value={selectedOption}
            onChange={(o) => setSelectedOption(o)}
            stylesTheme="default.sm"
          />
          <Box my={6}>
            {isLoading ? (
              <LoadingMessage message="Loading" />
            ) : isError ? (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error fetching citation!</AlertTitle>
                <AlertDescription>{parseAPIError(error)}</AlertDescription>
              </Alert>
            ) : (
              <>
                <Box fontSize="sm" fontWeight="medium" dangerouslySetInnerHTML={{ __html: data.export }} />
                <Flex justifyContent="end">
                  <SimpleCopyButton text={data.export} variant="outline" size="xs" asHtml />
                </Flex>
              </>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
const Doi = memo(({ doiIDs, bibcode }: { doiIDs: Array<string>; bibcode: string }) => {
  if (isNilOrEmpty(bibcode)) {
    return null;
  }
  return (
    <>
      {doiIDs.map((id) => (
        <Stack direction="row" my={1} key={id}>
          <SimpleLink href={createUrlByType(bibcode, 'doi', id)} newTab _hover={{ textDecor: 'underline' }}>
            {id}
          </SimpleLink>
          <SimpleCopyButton text={id} variant="outline" size="xs" />
        </Stack>
      ))}
    </>
  );
}, equals);
Doi.displayName = 'Doi';

const Keywords = memo(({ keywords }: { keywords: Array<string> }) => {
  const label = `Search for papers that mention this keyword`;
  return (
    <Detail label={pluralize('Keyword', keywords?.length ?? 0)} value={keywords}>
      {(keywords) => (
        <Flex flexWrap={'wrap'}>
          {keywords.map((keyword) => (
            <Tag size="md" variant="subtle" whiteSpace="nowrap" m="1" key={keyword}>
              <HStack spacing="2">
                <Text>{keyword}</Text>
                <SearchQueryLink
                  params={{ q: `keyword:"${keyword}"` }}
                  textDecoration="none"
                  _hover={{
                    color: 'gray.900',
                  }}
                  aria-label={label}
                  fontSize="md"
                >
                  <Tooltip label={label}>
                    <Center>
                      <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                    </Center>
                  </Tooltip>
                </SearchQueryLink>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
Keywords.displayName = 'Keywords';

const UATKeywords = memo(({ keywords, ids }: { keywords: Array<string>; ids: Array<string> }) => {
  const label = `Search for papers that mention this keyword`;
  return (
    <Detail label={`UAT ${pluralize('Keyword', keywords?.length ?? 0)} (generated)`} value={keywords}>
      {(keywords) => (
        <Flex flexWrap={'wrap'}>
          {keywords.map((keyword, index) => (
            <Tag size="md" variant="subtle" whiteSpace={'nowrap'} m="1" key={keyword}>
              <HStack spacing="2">
                <Tooltip label={keyword}>
                  <SimpleLink
                    href={`https://astrothesaurus.org/uat/${encodeURIComponent(ids[index])}`}
                    newTab
                    isExternal
                  >
                    {shortenKeyword(keyword)}
                  </SimpleLink>
                </Tooltip>
                <SearchQueryLink
                  params={{ q: `uat:"${keyword.split('/').pop()}"` }}
                  textDecoration="none"
                  _hover={{
                    color: 'gray.900',
                  }}
                  aria-label={label}
                  fontSize="md"
                >
                  <Tooltip label={label}>
                    <Center>
                      <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                    </Center>
                  </Tooltip>
                </SearchQueryLink>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
UATKeywords.displayName = 'UATKeywords';

const PlanetaryFeatures = memo(({ features, ids }: { features: Array<string>; ids: Array<string> }) => {
  const label = `Search for papers that mention this feature`;
  const usgsLabel = `Go to the USGS page for this feature`;
  if (isNilOrEmpty(features) || isNilOrEmpty(ids)) {
    return null;
  }
  return (
    <Detail label={pluralize('Planetary Feature', features?.length ?? 0)} value={features}>
      {(features) => (
        <Flex flexWrap={'wrap'}>
          {features.map((feature, index) => (
            <Tag size="md" variant="subtle" whiteSpace="nowrap" m="1" key={feature}>
              <HStack spacing="2">
                <SimpleLink
                  href={`${EXTERNAL_URLS.USGS_PLANETARY_FEATURES}${ids[index]}`}
                  isExternal
                  aria-label={usgsLabel}
                  newTab
                  _hover={{ textDecor: 'underline' }}
                >
                  {feature.replaceAll('/', ' > ')}
                </SimpleLink>
                <HStack spacing="1">
                  <SearchQueryLink
                    params={{ q: `planetary_feature:"${feature}"` }}
                    textDecoration="none"
                    _hover={{
                      color: 'gray.900',
                    }}
                    aria-label={label}
                    fontSize="md"
                  >
                    <Tooltip label={label}>
                      <Center>
                        <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                      </Center>
                    </Tooltip>
                  </SearchQueryLink>
                </HStack>
              </HStack>
            </Tag>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);
PlanetaryFeatures.displayName = 'PlanetaryFeatures';

interface IDetailProps<T = string | Array<string>> {
  label: string;
  href?: string;
  newTab?: boolean;
  value: T;
  copiable?: boolean;
  children?: (value: T) => ReactElement;
}

// TODO: this should take in a list of deps or the whole doc and show/hide based on that
const Detail = <T,>(props: IDetailProps<T>): ReactElement => {
  const { label, href, newTab = false, value, copiable = false, children } = props;

  // show nothing if no value
  if (isNilOrEmpty(value)) {
    return null;
  }

  const normalizedValue = Array.isArray(value) ? value.join('; ') : value;

  return (
    <Tr>
      <Td>{label}</Td>
      <Td wordBreak="break-word">
        {href && (
          <SimpleLink href={href} newTab={newTab}>
            {normalizedValue}
          </SimpleLink>
        )}
        {typeof children === 'function'
          ? children(value)
          : !href && <span dangerouslySetInnerHTML={{ __html: normalizedValue }} />}
        {copiable && <SimpleCopyButton text={normalizedValue as string} size="xs" variant="outline" mx={2} />}
      </Td>
    </Tr>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
  try {
    const { id } = ctx.params as { id: string };
    const params = getAbstractParams(id);
    const queryClient = new QueryClient();
    await queryClient.fetchQuery({
      queryKey: searchKeys.abstract(id),
      queryFn: (qfCtx) => fetchSearchSSR(params, ctx, qfCtx),
    });
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (err) {
    logger.error({ err, url: ctx.resolvedUrl }, 'Error fetching details');
    return {
      props: {
        pageError: parseAPIError(err),
      },
    };
  }
});

const shortenKeyword = (keyword: string) => {
  const words = keyword.split('/');
  if (words.length <= 2) {
    return words.join(' > ');
  } else {
    return `${words[0]} > ... > ${words[words.length - 1]}`;
  }
};
