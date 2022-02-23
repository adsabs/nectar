import { IDocsEntity } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { Box, Link, Stack, Text } from '@chakra-ui/layout';
import { Flex } from '@chakra-ui/react';
import { Table, Tbody, Td, Tr } from '@chakra-ui/table';
import { AbstractSources } from '@components';
import { createUrlByType } from '@components/AbstractSources/linkGenerator';
import { IAllAuthorsModalProps } from '@components/AllAuthorsModal';
import { useGetAuthors } from '@components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@components/icons/Orcid';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { APP_DEFAULTS } from '@config';
import { withDetailsPage } from '@hocs/withDetailsPage';
import { composeNextGSSP } from '@utils';
import { useGetAbstract } from '@_api/search';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import NextLink from 'next/link';
import { isNil } from 'ramda';

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

const AbstractPage: NextPage<IAbstractPageProps> = (props: IAbstractPageProps) => {
  const { id, error } = props;

  // this *should* only ever fetch from pre-filled cache
  const { data, isSuccess } = useGetAbstract({ id });

  // should be able to access docs here directly
  const doc = isSuccess ? data.docs?.[0] : undefined;

  // process authors from doc
  const authors = useGetAuthors({ doc, includeAff: false });

  return (
    <AbsLayout doc={doc} titleDescription={''}>
      <Head>{isSuccess && <title>NASA Science Explorer - Abstract - {doc.title[0]}</title>}</Head>
      <Box as="article" aria-labelledby="title">
        {error && (
          <Alert status="error" mt={2}>
            <AlertIcon />
            {error.status}: {error.message}
          </Alert>
        )}
        {isSuccess && (
          <Stack direction="column" gap={2}>
            <Flex wrap="wrap">
              {authors.map(([, author, orcid], index) => (
                <Box mr={1} key={`${author}${index}`}>
                  <NextLink {...getLinkProps('author', author)}>
                    <Link px={1} aria-label={`author "${author}", search by name`} flexShrink="0">
                      {author}
                    </Link>
                  </NextLink>
                  {typeof orcid === 'string' && (
                    <NextLink {...getLinkProps('orcid', orcid)}>
                      <Link aria-label={`author "${author}", search by orKid`}>
                        <OrcidActiveIcon fontSize={'large'} />
                      </Link>
                    </NextLink>
                  )}
                  <>{index === MAX - 1 || index === doc.author_count - 1 ? '' : ';'}</>
                </Box>
              ))}
              {doc.author_count > MAX ? (
                <AllAuthorsModal bibcode={doc.bibcode} label={`and ${doc.author_count - MAX} more`} />
              ) : (
                <AllAuthorsModal bibcode={doc.bibcode} label={'see all'} />
              )}
            </Flex>

            <AbstractSources doc={doc} />
            {isNil(doc.abstract) ? (
              <Text>No Abstract</Text>
            ) : (
              <Text dangerouslySetInnerHTML={{ __html: doc.abstract }}></Text>
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
const Details = ({ doc }: IDetailsProps) => {
  const arxiv = (doc.identifier ?? ([] as string[])).find((v) => /^arxiv/i.exec(v));

  const entries = [
    { label: 'Publication', value: doc.pub },
    { label: 'Publication Date', value: doc.pubdate },
    { label: 'DOI', value: doc.doi, href: doc.doi && createUrlByType(doc.bibcode, 'doi', doc.doi) },
    { label: 'arXiv', value: arxiv, href: arxiv && createUrlByType(doc.bibcode, 'arxiv', arxiv.split(':')[1]) },
    { label: 'Bibcode', value: doc.bibcode, href: `/abs/${doc.bibcode}/abstract` },
    { label: 'Keywords', value: doc.keyword },
    { label: 'E-Print Comments', value: doc.comment },
  ];

  return (
    <Box border="1px" borderColor="gray.50" borderRadius="md" shadow="sm">
      <Table colorScheme="gray" size="md">
        <Tbody>
          {entries.map(({ label, value, href }) => (
            <Tr key={label}>
              <Td>{label}</Td>
              <Td wordBreak="break-word">
                {href && href !== '' ? (
                  <NextLink href={href} passHref>
                    <Link target="_blank" rel="noreferrer">
                      {Array.isArray(value) ? value.join('; ') : value}
                    </Link>
                  </NextLink>
                ) : (
                  <>{Array.isArray(value) ? value.join('; ') : value}</>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = composeNextGSSP(withDetailsPage);
