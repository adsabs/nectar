import { IADSApiSearchParams, IDocsEntity, useGetAbstract } from '@api';
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Link,
  Stack,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Tooltip,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import { ChatIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  AbstractSources,
  AddToLibraryModal,
  feedbackItems,
  LabeledCopyButton,
  SearchQueryLink,
  SimpleLink,
} from '@components';
import { createUrlByType } from '@components/AbstractSources/linkGenerator';
import { IAllAuthorsModalProps } from '@components/AllAuthorsModal';
import { useGetAuthors } from '@components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@components/icons/Orcid';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { APP_DEFAULTS, EXTERNAL_URLS, NASA_SCIX_BRAND_NAME } from '@config';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useIsClient } from '@lib/useIsClient';
import { composeNextGSSP } from '@ssr-utils';
import { pluralize, unwrapStringValue } from '@utils';
import { MathJax } from 'better-react-mathjax';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import NextLink from 'next/link';
import { equals, isNil, path } from 'ramda';
import { memo, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { FolderPlusIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import { useSession } from '@lib/useSession';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

const AllAuthorsModal = dynamic<IAllAuthorsModalProps>(
  () => import('@components/AllAuthorsModal').then((m) => m.AllAuthorsModal),
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
    <AbsLayout doc={doc} titleDescription={''}>
      <Head>
        <title>{getDetailsPageTitle(doc, 'Abstract')}</title>
      </Head>
      <Box as="article" aria-labelledby="title">
        {doc && (
          <Stack direction="column" gap={2}>
            {isClient ? (
              <Flex wrap="wrap">
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
                  <>{doc.author_count > 0 && <AllAuthorsModal bibcode={doc.bibcode} label={'show list'} />}</>
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
              <AbstractSources doc={doc} />
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
            <Box py="2">
              {isNil(doc?.abstract) ? (
                <Text>No Abstract</Text>
              ) : (
                <Text as={MathJax} dangerouslySetInnerHTML={{ __html: doc.abstract }} />
              )}
            </Box>
            <Details doc={doc} />
            <Flex justifyContent="end">
              <Button variant="link" onClick={handleFeedback}>
                <ChatIcon mr={2} /> Feedback/Corrections?
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

  return (
    <Box border="1px" borderColor="gray.50" borderRadius="md" shadow="sm">
      <Table colorScheme="gray" size="md">
        <Tbody>
          <Detail label="Publication" value={doc.pub_raw}>
            {(pub_raw) => <span dangerouslySetInnerHTML={{ __html: pub_raw }}></span>}
          </Detail>
          <Detail label="Book Author(s)" value={doc.book_author} />
          <Detail label="Publication Date" value={doc.pubdate} />
          <Detail label="DOI" value={doc.doi}>
            {(doi) => (
              <>
                {doi.map((v) => {
                  const href = createUrlByType(doc?.bibcode, 'doi', v);
                  return (
                    <p>
                      <NextLink href={href} passHref legacyBehavior>
                        <Link rel="noreferrer noopener" isExternal>
                          {v} <ExternalLinkIcon mx="2px" />
                        </Link>
                      </NextLink>
                    </p>
                  );
                })}
              </>
            )}
          </Detail>
          <Detail label="arXiv" value={arxiv} href={createUrlByType(doc?.bibcode, 'arxiv', arxiv?.split(':')[1])} />
          <Detail label="Bibcode" value={doc.bibcode}>
            {(bibcode) => <LabeledCopyButton text={doc.bibcode} label={bibcode} />}
          </Detail>
          <Keywords keywords={doc.keyword} />
          <PlanetaryFeatures features={doc.gpn} ids={doc.gpn_id} />
          <Detail label="Comment(s)" value={doc.comment} />
          <Detail label="E-Print Comment(s)" value={doc.pubnote} />
        </Tbody>
      </Table>
    </Box>
  );
};

const Keywords = memo(({ keywords }: { keywords: string[] }) => {
  return (
    <Detail label={pluralize('Keyword', keywords.length)} value={keywords}>
      {(keywords) => (
        <Flex flexWrap={'wrap'}>
          {keywords.map((keyword) => (
            <SearchQueryLink key={keyword} params={{ q: `keyword:"${keyword}"` }} _hover={{ textDecoration: 'none' }}>
              <Tooltip label={`Search for papers that mention this keyword`} key={keyword}>
                <Tag size="sm" variant="subtle" bgColor="gray.100" whiteSpace={'nowrap'} m="1">
                  <HStack spacing="1">
                    <Text>{keyword}</Text>
                    <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
                  </HStack>
                </Tag>
              </Tooltip>
            </SearchQueryLink>
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);

const PlanetaryFeatures = memo(({ features, ids }: { features: Array<string>; ids: Array<string> }) => {
  return (
    <Detail label={pluralize('Planetary Feature', features.length)} value={features}>
      {(features) => (
        <Flex flexWrap={'wrap'}>
          {features.map((feature, index) => (
            <PlanetaryFeatureTag name={feature} id={ids?.[index] ?? ''} key={feature} />
          ))}
        </Flex>
      )}
    </Detail>
  );
}, equals);

const PlanetaryFeatureTag = ({ name, id }: { name: string; id: string }) => {
  const label = `Search for papers that mention this feature`;
  const usgsLabel = `Go to the USGS page for this feature`;
  return (
    <Flex direction="row" alignItems="center">
      <SearchQueryLink params={{ q: `gpn:"${name}"` }} textDecoration="none">
        <Tooltip label={label}>
          <Tag
            size="sm"
            variant="subtle"
            bgColor="gray.100"
            whiteSpace="nowrap"
            m="1"
            _hover={{
              color: 'black',
            }}
          >
            <HStack spacing="1">
              <Text>{name}</Text>
              <Icon as={MagnifyingGlassIcon} transform="rotate(90deg)" />
            </HStack>
          </Tag>
        </Tooltip>
      </SearchQueryLink>

      <Box px="1">
        <SimpleLink
          variant="subtle"
          href={`${EXTERNAL_URLS.USGS_PLANETARY_FEATURES}${id}`}
          isExternal
          textDecoration="none"
          color="gray.500"
          _hover={{
            color: 'gray.700',
          }}
          aria-label={usgsLabel}
        >
          <Tooltip label={usgsLabel}>
            <Center>
              <Icon as={GlobeAltIcon} /> <ExternalLinkIcon mx="2px" />
            </Center>
          </Tooltip>
        </SimpleLink>
      </Box>
    </Flex>
  );
};

interface IDetailProps<T = string | string[]> {
  label: string;
  href?: string;
  value: T;
  children?: (value: T) => ReactElement;
}

const Detail = <T,>(props: IDetailProps<T>): ReactElement => {
  const { label, href, value, children } = props;

  // show nothing if no value
  if (!value) {
    return null;
  }

  const normalizedValue = Array.isArray(value) ? value.join('; ') : value;

  return (
    <Tr>
      <Td>{label}</Td>
      <Td wordBreak="break-word">
        {href && (
          <NextLink href={href} passHref legacyBehavior>
            <Link rel="noreferrer noopener" isExternal>
              {normalizedValue} <ExternalLinkIcon mx="2px" />
            </Link>
          </NextLink>
        )}
        {typeof children === 'function' ? children(value) : !href && normalizedValue}
      </Td>
    </Tr>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage);

export const getDetailsPageTitle = (doc: IDocsEntity, name: string): string => {
  const title = unwrapStringValue(doc?.title);
  const subTitle = `${name} - ${title}`;
  return `${isNil(title) ? name : subTitle} - ${NASA_SCIX_BRAND_NAME}`;
};
