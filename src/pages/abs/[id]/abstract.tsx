import AdsApi, { IDocsEntity, IUserData, SolrSort } from '@api';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { Button } from '@chakra-ui/button';
import { Box, Flex, HStack, Link, Stack, Text } from '@chakra-ui/layout';
import { Heading } from '@chakra-ui/react';
import { Table, Tbody, Td, Tr } from '@chakra-ui/table';
import { AbstractSources, metatagsQueryFields } from '@components';
import { abstractPageNavDefaultQueryFields } from '@components/AbstractSideNav/model';
import { fetchHasGraphics, fetchHasMetrics } from '@components/AbstractSideNav/queries';
import { createUrlByType } from '@components/AbstractSources/linkGenerator';
import { AbsLayout } from '@components/Layout/AbsLayout';
import { useAPI } from '@hooks';
import { GetServerSideProps, NextPage } from 'next';
import NextImage from 'next/image';
import NextLink from 'next/link';
import { isNil } from 'ramda';
import { useEffect, useState } from 'react';
import { dehydrate, QueryClient } from 'react-query';
import { isBrowser, normalizeURLParams } from 'src/utils';
export interface IAbstractPageProps {
  doc?: IDocsEntity;
  error?: string;
  params: {
    q: string;
    fl: string[];
    sort: SolrSort[];
  };
}

const MAX_AUTHORS = 50;

const AbstractPage: NextPage<IAbstractPageProps> = (props: IAbstractPageProps) => {
  const { doc, error, params } = props;

  const [showNumAuthors, setShowNumAuthors] = useState<number>(MAX_AUTHORS);

  const [aff, setAff] = useState({ show: false, data: [] as string[] });

  // onComponentDidMount
  useEffect(() => {
    if (doc && showNumAuthors > doc.author.length) {
      setShowNumAuthors(doc.author.length);
    }
  }, [doc]);

  const { api } = useAPI();

  const handleShowAllAuthors = () => {
    setShowNumAuthors(doc.author.length);
  };

  const handleShowLessAuthors = () => {
    setShowNumAuthors(Math.min(doc.author.length, MAX_AUTHORS));
  };

  const handleShowAff = () => {
    if (aff.data.length === 0) {
      params.fl = ['aff'];
      void api.search.query(params).then((result) => {
        result.match(
          ({ response }) => {
            setAff({ show: true, data: response.docs[0].aff });
          },
          () => {
            return;
          },
        );
      });
    } else {
      setAff({ show: true, data: aff.data });
    }
  };

  const handleHideAff = () => {
    setAff({ show: false, data: aff.data });
  };

  return (
    <AbsLayout doc={doc} titleDescription={''}>
      <Box as="article" aria-labelledby="title">
        {error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : (
          <Stack direction="column" gap={2}>
            <Heading as="h2" variant="abstract" id="title">
              {doc.title}
            </Heading>
            <HStack spacing={1}>
              {isBrowser() ? (
                <>
                  <Button onClick={aff.show ? handleHideAff : handleShowAff} variant="outline" size="xs">
                    {aff.show ? 'hide affiliations' : 'show affiliations'}
                  </Button>
                  {doc.author.length > MAX_AUTHORS && (
                    <Button
                      onClick={doc.author.length > showNumAuthors ? handleShowAllAuthors : handleShowLessAuthors}
                      variant="outline"
                      size="xs"
                    >
                      {doc.author.length > showNumAuthors ? 'show all authors' : 'show less authors'}
                    </Button>
                  )}
                </>
              ) : null}
            </HStack>
            {doc.author && doc.author.length > 0 && (
              <Flex direction={aff.show ? 'column' : 'row'} wrap="wrap">
                {doc.author.slice(0, showNumAuthors).map((a, index) => {
                  const orcid =
                    doc.orcid_pub && doc.orcid_pub[index] !== '-'
                      ? doc.orcid_pub[index]
                      : doc.orcid_user && doc.orcid_user[index] !== '-'
                      ? doc.orcid_user[index]
                      : doc.orcid_other && doc.orcid_other[index] !== '-'
                      ? doc.orcid_other[index]
                      : undefined;
                  return (
                    <Box mr={1} key={index}>
                      <NextLink
                        href={`/search?q=${encodeURIComponent(`author:"${a}"`)}&sort=${encodeURIComponent(
                          'date desc, bibcode desc',
                        )}`}
                        passHref
                      >
                        <Link>{a}</Link>
                      </NextLink>
                      {orcid && (
                        <NextLink
                          href={{
                            pathname: '/search',
                            query: { q: `orcid:${orcid}`, sort: 'date desc, bibcode desc' },
                          }}
                          passHref
                        >
                          <Link px={1}>
                            <NextImage src="/img/orcid-active.svg" width="16px" height="16px" alt="Search by ORCID" />
                          </Link>
                        </NextLink>
                      )}
                      {aff.show ? <>({aff.data[index]})</> : null}
                      <>{index === MAX_AUTHORS - 1 || index + 1 === doc.author.length ? ' ' : ';'}</>
                    </Box>
                  );
                })}
                {isBrowser() && doc.author.length > showNumAuthors ? (
                  <Link onClick={handleShowAllAuthors} fontStyle="italic">{`and ${
                    doc.author.length - showNumAuthors
                  } more`}</Link>
                ) : null}
                {!isBrowser() && doc.author.length > showNumAuthors ? (
                  <Text as="span" fontStyle="italic">{`and ${doc.author.length - showNumAuthors} more`}</Text>
                ) : null}
              </Flex>
            )}

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
    <Box variant="simple" border="1px" borderColor="gray.50" borderRadius="md" shadow="sm">
      <Table colorScheme="gray" size="md">
        <Tbody>
          {entries.map(({ label, value, href }) => (
            <Tr key={label}>
              <Td>{label}</Td>
              <Td>
                {href && href !== '' ? (
                  <NextLink href={href}>
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

export const getServerSideProps: GetServerSideProps<IAbstractPageProps> = async (ctx) => {
  const query = normalizeURLParams(ctx.query);
  const request = ctx.req as typeof ctx.req & {
    session: { userData: IUserData };
  };
  const userData = request.session.userData;
  const params = {
    q: `identifier:${query.id}`,
    fl: [
      ...abstractPageNavDefaultQueryFields,
      ...metatagsQueryFields,
      'author_count',
      'comment',
      'data',
      'orcid_pub',
      'orcid_user',
      'orcid_other',
      'property',
    ],
    sort: query.sort ? (query.sort.split(',') as SolrSort[]) : [],
  };
  const adsapi = new AdsApi({ token: userData.access_token });
  const result = await adsapi.search.query(params);

  const queryClient = new QueryClient();
  if (result.isOk()) {
    const { bibcode } = result.value.response.docs[0];
    void (await queryClient.prefetchQuery(['hasGraphics', bibcode], () => fetchHasGraphics(adsapi, bibcode)));
    void (await queryClient.prefetchQuery(['hasMetrics', bibcode], () => fetchHasMetrics(adsapi, bibcode)));
  }

  if (result.isErr()) {
    return { props: { doc: null, params, error: 'Unable to get abstract' } };
  }

  const { numFound, docs } = result.value.response;

  return numFound === 0
    ? { notFound: true }
    : {
        props: {
          dehydratedState: dehydrate(queryClient),
          doc: docs[0],
          params,
        },
      };
};
