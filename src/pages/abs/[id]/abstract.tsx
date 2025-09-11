import { Box, Button, Flex, IconButton, Stack, Text, Tooltip, useDisclosure, VisuallyHidden } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';

import { IAllAuthorsModalProps } from '@/components/AllAuthorsModal';
import { useGetAuthors } from '@/components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@/components/icons/Orcid';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { APP_DEFAULTS, sessionConfig } from '@/config';
import { MathJax } from 'better-react-mathjax';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import { isNil, path } from 'ramda';
import { useRouter } from 'next/router';
import { FolderPlusIcon } from '@heroicons/react/24/solid';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';
import { feedbackItems } from '@/components/NavBar';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { AbstractSources } from '@/components/AbstractSources';
import { AddToLibraryModal } from '@/components/Libraries';
import { searchKeys, useGetAbstract } from '@/api/search/search';
import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity } from '@/api/search/types';
import { getAbstractParams } from '@/api/search/models';
import { useTrackAbstractView } from '@/lib/useTrackAbstractView';
import { AbstractDetails, AbstractMetadata, IAbstractMetadata } from '@/components/AbstractDetails';
import { bootstrap } from '@/lib/serverside/bootstrap';
import { ApiTargets } from '@/api/models';
import { stringifySearchParams } from '@/utils/common/search';
import { getIronSession } from 'iron-session/edge';
import { isAuthenticated } from '@/api/api';

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

interface AbstractPageProps {
  initialDoc?: IDocsEntity | null;
  isAuthenticated?: boolean;
}

const AbstractPage: NextPage<AbstractPageProps> = ({ initialDoc, isAuthenticated }) => {
  const router = useRouter();
  const { data } = useGetAbstract({ id: router.query.id as string });
  const doc = path<IDocsEntity>(['docs', 0], data) ?? initialDoc ?? undefined;
  useTrackAbstractView(doc);

  const metadata: IAbstractMetadata = {
    refereed: doc.property?.includes('REFEREED'),
    doctype: doc.doctype && doc.doctype !== 'erratum' ? doc.doctype : undefined,
    erratum: doc.doctype === 'erratum',
  };

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
            <Flex wrap="wrap" as="section" aria-labelledby="author-list">
              <VisuallyHidden as="h2" id="author-list">
                Authors
              </VisuallyHidden>
              {authors.map(([, author, orcid], index) => {
                const showOrcid = typeof orcid === 'string' && orcid.length > 0;
                const isTerminalAuthor = index === MAX - 1 || index === doc.author_count - 1;
                return (
                  <Flex key={`${author}-${index}`} mr={1} align="center">
                    <Tooltip label="View all records by this author" shouldWrapChildren>
                      <SearchQueryLink
                        params={createQuery('author', author)}
                        px={1}
                        aria-label={`author "${author}", search by name`}
                        flexShrink="0"
                      >
                        {author}
                      </SearchQueryLink>
                    </Tooltip>
                    {showOrcid ? (
                      <Box as="span" display="inline-flex" justifyContent="center" mx={1}>
                        <Tooltip label="Search by ORCiD" shouldWrapChildren>
                          <SearchQueryLink
                            params={createQuery('orcid', orcid)}
                            aria-label={`author "${author}", search by orKid`}
                          >
                            <OrcidActiveIcon fontSize={'large'} />
                          </SearchQueryLink>
                        </Tooltip>
                      </Box>
                    ) : null}
                    {isTerminalAuthor ? null : (
                      <Text as="span" ml={showOrcid ? 1 : 0} mr={1}>
                        ;
                      </Text>
                    )}
                  </Flex>
                );
              })}
              {doc.author_count > MAX ? (
                <AllAuthorsModal bibcode={doc.bibcode} label={`and ${doc.author_count - MAX} more`} />
              ) : (
                <>
                  {doc.author_count > 0 && (
                    <Tooltip label="List all authors and affiliations" shouldWrapChildren>
                      <AllAuthorsModal bibcode={doc.bibcode} label={'show details'} />
                    </Tooltip>
                  )}
                </>
              )}
            </Flex>

            <AbstractMetadata {...metadata} />

            <Flex justifyContent="space-between">
              <Box display={{ base: 'block', lg: 'none' }}>
                <AbstractSources doc={doc} style="menu" />
              </Box>
              {isAuthenticated ? (
                <Flex minH={8} align="center" justify="center">
                  <Tooltip label="add to library">
                    <IconButton
                      aria-label="Add to library"
                      icon={<FolderPlusIcon />}
                      variant="ghost"
                      onClick={onOpenAddToLibrary}
                    />
                  </Tooltip>
                </Flex>
              ) : null}
            </Flex>

            <Box as="section" pb="2" aria-labelledby="abstract">
              <VisuallyHidden as="h2" id="abstract">
                Abstract
              </VisuallyHidden>
              {isNil(doc?.abstract) ? (
                <Text>No Abstract</Text>
              ) : (
                <Text as={MathJax} dangerouslySetInnerHTML={{ __html: doc.abstract }} />
              )}
            </Box>
            <AbstractDetails doc={doc} />
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const bsRes = await bootstrap(ctx.req, ctx.res);
  if (bsRes.error) {
    logger.error({ error: bsRes.error, url: ctx.resolvedUrl }, 'Error during bootstrap');
    return { props: { pageError: bsRes.error } };
  }

  const params = getAbstractParams(ctx.params.id as string);
  const queryClient = new QueryClient();

  const url = new URL(`${process.env.API_HOST_SERVER}${ApiTargets.SEARCH}`);
  url.search = stringifySearchParams(params);

  const session = await getIronSession(ctx.req, ctx.res, sessionConfig);

  try {
    const result = await fetch(url, {
      headers: new Headers({ Authorization: `Bearer ${bsRes.token.access_token}` }),
    });
    const data = (await result.json()) as IADSApiSearchResponse;
    queryClient.setQueryData(searchKeys.abstract(ctx.params.id as string), data);
    queryClient.setQueryData(['user'], bsRes.token);
    ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    const initialDoc = data?.response?.docs?.[0] ?? null;

    return {
      props: {
        isAuthenticated: isAuthenticated(session.token),
        dehydratedState: dehydrate(queryClient),
        initialDoc,
      },
    };
  } catch (error) {
    logger.error({ error, url: url.toString() }, 'Error fetching abstract data');
    return {
      props: {
        pageError: 'Failed to load abstract data',
        initialDoc: null,
      },
    };
  }
};
