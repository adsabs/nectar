import { IADSApiSearchParams } from '@/api/search/types';
import { DatabaseEnum, IADSApiUserDataResponse } from '@/api/user/types';
import {
  Box,
  Center,
  Flex,
  Heading,
  Stack,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  Text,
  useMediaQuery,
  VisuallyHidden,
} from '@chakra-ui/react';

import { applyFiltersToQuery } from '@/components/SearchFacet/helpers';
import { useStore } from '@/store';
import { NextPage } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';
import { useSettings } from '@/lib/useSettings';

import { NotificationId } from '@/store/slices';
import { SearchBar } from '@/components/SearchBar';
import { SimpleLink } from '@/components/SimpleLink';
import { makeSearchParams, normalizeSolrSort } from '@/utils/common/search';
import { SolrSort } from '@/api/models';
import { SearchExamples } from '@/components/SearchExamples/SearchExamples';
import { Pager } from '@/components/Pager/Pager';

const HomePage: NextPage = () => {
  const { settings } = useSettings();
  const [queryAddition, setQueryAddition] = useState('');
  const [query, setQuery] = useState<string>('');
  const sort = [`${settings.preferredSearchSort} desc` as SolrSort];
  const submitQuery = useStore((state) => state.submitQuery);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const clearSelectedDocs = useStore((state) => state.clearAllSelected);
  const setNotification = useStore((state) => state.setNotification);

  useEffect(() => {
    const setNotify = () => {
      if (router.query.notify) {
        setNotification(router.query.notify as NotificationId);
      }
    };
    router.events.on('routeChangeComplete', setNotify);
    return () => router.events.off('routeChangeComplete', setNotify);
  }, [router, setNotification]);

  // clear search on mount
  useEffect(() => {
    clearSelectedDocs();
    setQuery('');
  }, [clearSelectedDocs]);

  /**
   * Take in a query object and apply any FQ filters
   * These will either be any default ON filters or whatever has been set by the user in the preferences
   */
  const applyDefaultFilters = useCallback(
    (query: IADSApiSearchParams) => {
      const defaultDatabases = getListOfAppliedDefaultDatabases(settings.defaultDatabase);
      if (Array.isArray(defaultDatabases) && defaultDatabases.length > 0) {
        return applyFiltersToQuery({
          query,
          values: defaultDatabases,
          field: 'database',
          logic: 'or',
        });
      }
      return query;
    },
    [settings.defaultDatabase],
  );

  /**
   * update route and start searching
   */
  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const query = new FormData(e.currentTarget).get('q') as string;

      if (query && query.trim().length > 0) {
        setIsLoading(true);
        submitQuery();
        void router
          .push({
            pathname: '/search',
            search: makeSearchParams(applyDefaultFilters({ q: query, sort, p: 1 })),
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    },
    [applyDefaultFilters, router, sort, submitQuery],
  );

  const handleQueryExampleSelect = useCallback(
    (textToAppend) => {
      setQueryAddition(textToAppend);

      // Allow the user to continuously append if they'd like
      setTimeout(setQueryAddition, 0, '');
    },
    [setQueryAddition],
  );

  const [isMobile] = useMediaQuery('(max-width: 800px)');

  return (
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <VisuallyHidden as="h2" id="form-title">
          Modern Search Form
        </VisuallyHidden>
        <Flex direction="column">
          <Box my={2}>
            <SearchBar isLoading={isLoading} query={query} queryAddition={queryAddition} />
          </Box>
          {isMobile ? (
            <>
              <Heading as="h3" my={5}>
                <Center>
                  <Text fontWeight="thin">Search Examples</Text>
                </Center>
              </Heading>
              <SearchExamples onSelectExample={handleQueryExampleSelect} />
            </>
          ) : (
            <Box mb={2} mt={5} minW="md">
              <Carousel onExampleSelect={handleQueryExampleSelect} />
            </Box>
          )}
        </Flex>
        <Stats />
        <input type="hidden" name="sort" value={normalizeSolrSort(sort)} />
        <input type="hidden" name="p" value="1" />
      </form>
    </Box>
  );
};

export default HomePage;

const Carousel = (props: { onExampleSelect: (text: string) => void }) => {
  const [initialPage, setInitialPage] = useState<number>(0);
  const { onExampleSelect } = props;

  useEffect(() => {
    setInitialPage(parseInt(localStorage.getItem('carousel') ?? '0', 10));
  }, []);

  const handlePageChange = (page: number) => {
    localStorage.setItem('carousel', page.toString());
  };

  return (
    <Pager
      onChangePage={handlePageChange}
      initialPage={initialPage}
      pages={[
        {
          uniqueId: 'explore',
          content: (
            <Stack flexDirection="column" textAlign="left" spacing="4">
              <Heading as="h3">
                <Text fontWeight="thin" display="inline">
                  WELCOME TO THE
                </Text>
                <Text fontWeight="bold" display="inline" ml={2}>
                  SciX Digital Library
                </Text>
              </Heading>
              <Heading as="h4">
                <Text fontSize="2xl">Explore Across Science Focus Areas</Text>
              </Heading>
              <Image
                src="/images/carousel/banner_sciencetopics.webp"
                alt="all scix focus areas"
                width={760}
                height={200}
                quality={90}
              />
              <Text fontSize="xl">
                SciX covers and unifies the fields of Earth Science, Planetary Science, Astrophysics, and Heliophysics.
                It will also cover NASA funded research in Biological and Physical Sciences.
              </Text>
            </Stack>
          ),
        },
        {
          uniqueId: 'discover',
          content: (
            <Stack flexDirection="column" textAlign="left" spacing="4">
              <Heading as="h3">
                <Text fontWeight="thin">DISCOVER</Text>
                <Text fontWeight="bold">Open Science</Text>
              </Heading>
              <Flex>
                <Text fontSize="xl" py="4" pr="4">
                  SciX is part of the NASA Open Source Science Initiative. SciX supports open science principles,
                  expanding access & accelerating scientific discovery for societal benefit.
                </Text>
                <Image
                  src="/images/carousel/lightbulb_science.webp"
                  alt="lightbulb and open padlock unlocking scientific ideas"
                  width={300}
                  height={300}
                  quality={90}
                />
              </Flex>
            </Stack>
          ),
        },
        {
          uniqueId: 'new-user',
          content: (
            <Stack flexDirection="column" textAlign="left" spacing="8">
              <Heading as="h3">
                <Text fontWeight="thin">NEW USER</Text>
                <Text fontWeight="bold">Quick Start Guide</Text>
              </Heading>
              <Text fontSize="xl">
                SciX has a user-friendly search interface. New users will have no trouble jumping in to explore.
              </Text>
              <Text fontSize="xl">
                Use the{' '}
                <SimpleLink
                  href="/scixhelp/quickstart-scix/searching-for-paper"
                  anchorProps={{ display: 'inline' }}
                  newTab
                >
                  quick start guide
                </SimpleLink>{' '}
                to start your search of the portal and find out where to go with any questions about advanced tools and
                features.
              </Text>
            </Stack>
          ),
        },
        {
          uniqueId: 'search-examples',
          title: 'Search Examples',
          content: <SearchExamples onSelectExample={onExampleSelect} />,
        },
      ]}
    />
  );
};

/**
 * Get a list of default databases that have been applied
 * @param databases
 */
const getListOfAppliedDefaultDatabases = (databases: IADSApiUserDataResponse['defaultDatabase']): Array<string> => {
  const defaultDatabases = [];
  for (const db of databases) {
    // if All is selected, exit early here and return an empty array (no filters to apply)
    if (db.name === DatabaseEnum.All && db.value) {
      return [];
    }

    if (db.value) {
      defaultDatabases.push(db.name);
    }
  }
  return defaultDatabases;
};

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';

const Stats = () => {
  return (
    <Box borderWidth={0.5} borderRadius={5} p={4} mt={5}>
      <StatGroup>
        <Stat>
          <StatLabel>Scientific Records</StatLabel>
          <StatNumber>30M+</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Citations</StatLabel>
          <StatNumber>300M+</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Peer reviewed journals</StatLabel>
          <StatNumber>~8000</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Annual Users</StatLabel>
          <StatNumber>16M+</StatNumber>
        </Stat>
      </StatGroup>
    </Box>
  );
};
