import { IADSApiSearchParams, IDocsEntity, useGetAbstract } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Link, Stack, Text } from '@chakra-ui/layout';
import { Flex, Tag } from '@chakra-ui/react';
import { Table, Tbody, Td, Tr } from '@chakra-ui/table';
import { AbstractSources, SearchQueryLink } from '@components';
import { createUrlByType } from '@components/AbstractSources/linkGenerator';
import { IAllAuthorsModalProps } from '@components/AllAuthorsModal';
import { useGetAuthors } from '@components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@components/icons/Orcid';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { APP_DEFAULTS } from '@config';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { useIsClient } from '@hooks/useIsClient';
import { composeNextGSSP } from '@ssrUtils';
import { unwrapStringValue } from '@utils';
import { MathJax } from 'better-react-mathjax';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import NextLink from 'next/link';
import { isNil } from 'ramda';
import { ReactElement } from 'react';

const AllAuthorsModal = dynamic<IAllAuthorsModalProps>(
  () => import('@components/AllAuthorsModal').then((m) => m.AllAuthorsModal),
  { ssr: false },
);

export interface IAbstractPageProps {
  id: string;
  error?: {
    status?: string;
    message?: string;
  };
}

const MAX = APP_DEFAULTS.DETAILS_MAX_AUTHORS;

const createQuery = (type: 'author' | 'orcid', value: string): IADSApiSearchParams => {
  return { q: `${type}:"${value}"`, sort: ['date desc'] };
};

const AbstractPage: NextPage<IAbstractPageProps> = (props: IAbstractPageProps) => {
  const { id, error } = props;

  const isClient = useIsClient();

  // this *should* only ever fetch from pre-filled cache
  const { data, isSuccess } = useGetAbstract({ id });

  // should be able to access docs here directly
  const doc = isSuccess ? data.docs?.[0] : undefined;

  // process authors from doc
  const authors = useGetAuthors({ doc, includeAff: false });

  const title = unwrapStringValue(doc?.title);

  return (
    <AbsLayout doc={doc} titleDescription={''}>
      <Head>{isSuccess && <title>NASA Science Explorer - Abstract - {title}</title>}</Head>
      <Box as="article" aria-labelledby="title">
        {error && (
          <Alert status="error" mt={2}>
            <AlertIcon />
            {error.status}: {error.message}
          </Alert>
        )}
        {isSuccess && (
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
                        <OrcidActiveIcon fontSize={'large'} />
                      </SearchQueryLink>
                    )}
                    <>{index === MAX - 1 || index === doc.author_count - 1 ? '' : ';'}</>
                  </Box>
                ))}
                {doc.author_count > MAX ? (
                  <AllAuthorsModal bibcode={doc.bibcode} label={`and ${doc.author_count - MAX} more`} />
                ) : (
                  <AllAuthorsModal bibcode={doc.bibcode} label={'show list'} />
                )}
              </Flex>
            ) : (
              <Flex wrap="wrap">
                {doc?.author.map((author, index) => (
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
                {doc.author_count > MAX ? <Text>{` and ${doc.author_count - MAX} more`}</Text> : null}
              </Flex>
            )}

            <AbstractSources doc={doc} />
            {isNil(doc.abstract) ? (
              <Text>No Abstract</Text>
            ) : (
              <Text as={MathJax} dangerouslySetInnerHTML={{ __html: doc.abstract }} />
            )}
            <Details doc={doc} />
          </Stack>
        )}
      </Box>
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
          <Detail label="DOI" value={doc.doi} href={createUrlByType(doc?.bibcode, 'doi', doc?.doi)} />
          <Detail label="arXiv" value={arxiv} href={createUrlByType(doc?.bibcode, 'arxiv', arxiv?.split(':')[1])} />
          <Detail label="Bibcode" value={doc.bibcode} href={`/abs/${doc.bibcode}/abstract`} />
          <Detail label="Keyword(s)" value={doc.keyword}>
            {(keywords) => (
              <Flex flexWrap={'wrap'}>
                {keywords.map((keyword) => (
                  <SearchQueryLink
                    key={keyword}
                    params={{ q: `keyword:"${keyword}"` }}
                    _hover={{ textDecoration: 'none' }}
                  >
                    <Tag size="sm" key={keyword} variant="subtle" bgColor="gray.100" whiteSpace={'nowrap'} m="1">
                      {keyword}
                    </Tag>
                  </SearchQueryLink>
                ))}
              </Flex>
            )}
          </Detail>
          <Detail label="Comment(s)" value={doc.comment} />
          <Detail label="E-Print Comment(s)" value={doc.pubnote} />
        </Tbody>
      </Table>
    </Box>
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
