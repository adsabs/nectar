import { Box, Center, Flex, Heading, Spinner, Stack, Text, VisuallyHidden } from '@chakra-ui/react';
import { YouTubeEmbed } from '@next/third-parties/google';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';

import { SolrSort } from '@/api';
import { IADSApiSearchParams } from '@/api/search/types';
import { DatabaseEnum, IADSApiUserDataResponse } from '@/api/user/types';
import { IPagerProps, ISearchExamplesProps, SearchBar, SearchExamplesPlaceholder, SimpleLink } from '@/components';
import { applyFiltersToQuery } from '@/components/SearchFacet/helpers';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { useSettings } from '@/lib/useSettings';
import { useStore } from '@/store';
import { makeSearchParams, normalizeSolrSort } from '@/utils';

const SearchExamples = dynamic<ISearchExamplesProps>(
  () => import('@/components/SearchExamples').then((m) => m.SearchExamples),
  { ssr: false, loading: () => <SearchExamplesPlaceholder /> },
);
const Pager = dynamic<IPagerProps>(() => import('@/components/Pager').then((m) => m.Pager), {
  ssr: false,
  loading: () => (
    <Center>
      <Spinner />
    </Center>
  ),
});

const HomePage: NextPage = () => {
  const { settings } = useSettings();
  const sort = [`${settings.preferredSearchSort} desc` as SolrSort];
  const submitQuery = useStore((state) => state.submitQuery);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { clearQuery, updateQuery } = useIntermediateQuery();
  const clearSelectedDocs = useStore((state) => state.clearAllSelected);

  // clear search on mount
  useEffect(() => {
    clearSelectedDocs();
    clearQuery();
  }, []);

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
        updateQuery(query);
        setIsLoading(true);
        submitQuery();
        void router.push({
          pathname: '/search',
          search: makeSearchParams(applyDefaultFilters({ q: query, sort, p: 1 })),
        });
      }
    },
    [router, sort, submitQuery, updateQuery],
  );

  return (
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <VisuallyHidden as="h2" id="form-title">
          Modern Search Form
        </VisuallyHidden>
        <Flex direction="column">
          <Box my={2}>
            <SearchBar isLoading={isLoading} />
          </Box>
          <Box mb={2} mt={5} minW="md">
            <Carousel />
          </Box>
        </Flex>
        <input type="hidden" name="sort" value={normalizeSolrSort(sort)} />
        <input type="hidden" name="p" value="1" />
      </form>
    </Box>
  );
};

export default HomePage;

const Carousel = () => {
  const [initialPage, setInitialPage] = useState<number>(0);

  useEffect(() => {
    setInitialPage(parseInt(localStorage.getItem('carousel') ?? '0', 10));
  });

  const handlePageChange = (page: number) => {
    localStorage.setItem('carousel', page.toString());
  };

  return (
    <Pager
      onChangePage={handlePageChange}
      initialPage={initialPage}
      pages={[
        {
          uniqueId: 'welcome',
          content: (
            <Stack flexDirection="column" textAlign="left" spacing="4">
              <Heading as="h3">
                <Text fontWeight="thin">WELCOME TO THE</Text>
                <Text fontWeight="bold">SciX Digital Library</Text>
              </Heading>
              <Center>
                <YouTubeEmbed
                  videoid="LeTFmhmPjs0"
                  height={315}
                  width={560}
                  params="fs=0&rel=0"
                  playlabel="Learn more about the SciX digital library and how it can support your scientific research in this
                welcome video and brief user tutorial from Dr. Stephanie Jarmak."
                />
              </Center>
              <Text fontSize="xl">
                Learn more about the SciX digital library and how it can support your scientific research in this
                welcome video and brief user tutorial from <br /> Dr. Stephanie Jarmak.
              </Text>
            </Stack>
          ),
        },
        {
          uniqueId: 'explore',
          content: (
            <Stack flexDirection="column" textAlign="left" spacing="4">
              <Heading as="h3">
                <Text fontWeight="thin">EXPLORE ACROSS</Text>
                <Text fontWeight="bold">Science Focus Areas</Text>
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
                <SimpleLink href="/scixhelp/quickstart-scix/searching-for-paper" display="inline" isExternal>
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
          content: <SearchExamples />,
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