import { Box, Button, Flex, IconButton, Stack, Text, Tooltip, useDisclosure, VisuallyHidden } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';

import { IAllAuthorsModalProps } from '@/components/AllAuthorsModal';
import { useGetAuthors } from '@/components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@/components/icons/Orcid';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { APP_DEFAULTS } from '@/config';
import { useIsClient } from '@/lib/useIsClient';
import { MathJax } from 'better-react-mathjax';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import { isNil, path } from 'ramda';
import { useRouter } from 'next/router';
import { FolderPlusIcon } from '@heroicons/react/24/solid';
import { useSession } from '@/lib/useSession';
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
import { AbstractDetails } from '@/components/AbstractDetails';
import { bootstrap } from '@/lib/serverside/bootstrap';
import { ApiTargets } from '@/api/models';
import { stringifySearchParams } from '@/utils/common/search';

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
  useTrackAbstractView(doc);

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
  const result = await fetch(url, {
    headers: new Headers({ Authorization: `Bearer ${bsRes.token.access_token}` }),
  });
  const data = (await result.json()) as IADSApiSearchResponse;
  queryClient.setQueryData(searchKeys.abstract(ctx.params.id as string), data);
  queryClient.setQueryData(['user'], bsRes.token);
  ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
