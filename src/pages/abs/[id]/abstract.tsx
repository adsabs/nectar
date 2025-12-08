import { Box, Button, Flex, IconButton, Stack, Text, Tooltip, useDisclosure, VisuallyHidden } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { FolderPlusIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { isNil, path } from 'ramda';
import { useShepherd } from 'react-shepherd';
import { MathJax } from 'better-react-mathjax';

import { IAllAuthorsModalProps } from '@/components/AllAuthorsModal';
import { useGetAuthors } from '@/components/AllAuthorsModal/useGetAuthors';
import { OrcidActiveIcon } from '@/components/icons/Orcid';
import { AbsLayout } from '@/components/Layout/AbsLayout';
import { RecordNotFound } from '@/components/RecordNotFound';
import { feedbackItems, getAbstractSteps } from '@/components/NavBar';
import { SearchQueryLink } from '@/components/SearchQueryLink';
import { AbstractSources } from '@/components/AbstractSources';
import { AddToLibraryModal } from '@/components/Libraries';
import { AbstractDetails, AbstractMetadata, IAbstractMetadata } from '@/components/AbstractDetails';
import { APP_DEFAULTS } from '@/config';
import { useTrackAbstractView } from '@/lib/useTrackAbstractView';
import { useScreenSize } from '@/lib/useScreenSize';
import { LocalSettings } from '@/types';
import { createAbsGetServerSideProps } from '@/lib/serverside/absCanonicalization';
import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';
import { useGetAbstract } from '@/api/search/search';

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

const safeDecode = (value?: string) => {
  if (!value) {
    return '';
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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
    refereed: !!doc?.property?.includes('REFEREED'),
    doctype: doc?.doctype && doc.doctype !== 'erratum' ? doc.doctype : undefined,
    erratum: doc?.doctype === 'erratum',
  };
  const identifier = safeDecode(router.query.id as string);

  const authors = useGetAuthors({ doc, includeAff: false });
  const { isOpen: isAddToLibraryOpen, onClose: onCloseAddToLibrary, onOpen: onOpenAddToLibrary } = useDisclosure();

  useTour();

  const handleFeedback = () => {
    const bibcode = doc?.bibcode ?? identifier;
    void router.push({
      pathname: feedbackItems.record.path,
      query: { bibcode },
    });
  };

  return (
    <AbsLayout doc={doc} titleDescription={''} label="Abstract">
      <Box as="article" aria-labelledby="title">
        {!doc ? (
          <RecordNotFound recordId={identifier || 'N/A'} onFeedback={handleFeedback} />
        ) : (
          <Stack direction="column" gap={2}>
            <Flex wrap="wrap" as="section" aria-labelledby="author-list" id="tour-authors-list">
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
                      id="tour-add-to-library"
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
      {doc ? (
        <AddToLibraryModal isOpen={isAddToLibraryOpen} onClose={onCloseAddToLibrary} bibcodes={[doc.bibcode]} />
      ) : null}
    </AbsLayout>
  );
};

export default AbstractPage;

const useTour = () => {
  const Shepherd = useShepherd();
  const { isScreenLarge } = useScreenSize();
  const [isRendered, setIsRendered] = useState(false);

  // tour should not start until the first element is rendered
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const element = document.getElementById(
        isScreenLarge ? 'accordion-button-tour-full-text-sources' : 'menu-button-tour-full-text-sources',
      );
      if (element) {
        setIsRendered(true);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isRendered && !localStorage.getItem(LocalSettings.SEEN_ABSTRACT_TOUR)) {
      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          scrollTo: false,
          cancelIcon: {
            enabled: true,
          },
        },
        exitOnEsc: true,
      });
      tour.addSteps(getAbstractSteps(!isScreenLarge));
      localStorage.setItem(LocalSettings.SEEN_ABSTRACT_TOUR, 'true');
      setTimeout(() => {
        tour.start();
      }, 1000);
    }
  }, [isRendered, isScreenLarge]);
};

export const getServerSideProps = createAbsGetServerSideProps('abstract');
