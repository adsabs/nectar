import { IADSApiSearchParams } from '@/api/search/types';
import { DatabaseEnum, IADSApiUserDataResponse } from '@/api/user/types';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Stack,
  Text,
  useMediaQuery,
  VisuallyHidden,
  forwardRef,
} from '@chakra-ui/react';

import { applyFiltersToQuery } from '@/components/SearchFacet/helpers';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { useStore } from '@/store';
import { NextPage } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '@/lib/useSettings';

import { NotificationId } from '@/store/slices';
import { SearchBar } from '@/components/SearchBar';
import { SimpleLink } from '@/components/SimpleLink';
import { makeSearchParams, normalizeSolrSort } from '@/utils/common/search';
import { SolrSort } from '@/api/models';
import { SearchExamples } from '@/components/SearchExamples/SearchExamples';
import { useColorModeColors } from '@/lib/useColorModeColors';

const HomePage: NextPage = () => {
  const { settings } = useSettings();

  const submitQuery = useStore((state) => state.submitQuery);

  const clearSelectedDocs = useStore((state) => state.clearAllSelected);

  const setNotification = useStore((state) => state.setNotification);

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  // indicate search section is sticky when scrolled outside viewport
  const [isSearchSticky, setIsSearchSticky] = useState(false);

  const { clearQuery, updateQuery } = useIntermediateQuery();

  const colors = useColorModeColors();

  const [isMobile] = useMediaQuery('(max-width: 800px)');

  const searchSectionRef = useRef<HTMLDivElement>();

  const oriSearchLocRef = useRef<HTMLDivElement>();

  const examplesSectionRef = useRef<HTMLDivElement>();

  const quickStartSectionRef = useRef<HTMLDivElement>();

  const sort = [`${settings.preferredSearchSort} desc` as SolrSort];

  useEffect(() => {
    const setNotify = () => {
      if (router.query.notify) {
        setNotification(router.query.notify as NotificationId);
      }
    };
    router.events.on('routeChangeComplete', setNotify);
    return () => router.events.off('routeChangeComplete', setNotify);
  }, [router]);

  // clear search on mount
  useEffect(() => {
    clearSelectedDocs();
    clearQuery();
  }, []);

  // observe when search bar is outside viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // entry.isIntersecting is true when the element is in the viewport
        setIsSearchSticky(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
      },
      {
        root: null, // The viewport
        rootMargin: '0px',
        threshold: 0, // When 0% of the target is visible
      },
    );

    const current = oriSearchLocRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
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
    [router, sort, submitQuery, updateQuery],
  );

  return (
    <Box aria-labelledby="form-title" my={8}>
      <form method="get" action="/search" onSubmit={handleOnSubmit}>
        <VisuallyHidden as="h2" id="form-title" ref={oriSearchLocRef}>
          Modern Search Form
        </VisuallyHidden>
        <Flex direction="column" alignItems="center">
          <Flex
            py={4}
            px={isSearchSticky ? 4 : 0}
            w="full"
            ref={searchSectionRef}
            position={isSearchSticky ? 'fixed' : 'static'}
            top={isSearchSticky ? '0' : 'auto'}
            zIndex={isSearchSticky ? '100' : 'auto'}
            background={colors.background}
            justifyContent="center"
          >
            <Box w="container.md">
              <SearchBar isLoading={isLoading} />
            </Box>
          </Flex>
          {isMobile ? (
            <>
              <Heading as="h3" my={5}>
                <Center>
                  <Text fontWeight="thin">Search Examples</Text>
                </Center>
              </Heading>
              <SearchExamples />
            </>
          ) : (
            <Flex direction="column" mb={2} gap={20} alignItems="center">
              <IntroSection />
              <Stack spacing={4} direction={'row'} justifyContent="center">
                <Button
                  rounded={'full'}
                  px={6}
                  onClick={() => quickStartSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })}
                  size="md"
                >
                  Get started
                </Button>
                <Button
                  rounded={'full'}
                  px={6}
                  variant="outline"
                  onClick={() => examplesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })}
                  size="md"
                >
                  Search Examples
                </Button>
              </Stack>
              <ExploreSection />
              <DiscoverSection />
              <QuickStartSection ref={quickStartSectionRef} />
              <ExamplesSection ref={examplesSectionRef} />
            </Flex>
          )}
        </Flex>
        <input type="hidden" name="sort" value={normalizeSolrSort(sort)} />
        <input type="hidden" name="p" value="1" />
      </form>
    </Box>
  );
};

export default HomePage;

const IntroSection = () => {
  return (
    <Stack as="section" flexDirection="column" textAlign="left" spacing="4" p={10} pb={0} maxW="container.md">
      <Heading as="h3">
        <Text fontWeight="thin">WELCOME TO THE</Text>
        <Text fontWeight="bold">SciX Digital Library</Text>
      </Heading>
      <Text fontSize="xl">
        Learn more about the SciX digital library and how it can support your scientific research in{' '}
        <SimpleLink href="https://youtu.be/LeTFmhmPjs0" isExternal newTab>
          this welcome video
        </SimpleLink>{' '}
        and brief user tutorial from <br /> Dr. Stephanie Jarmak.
      </Text>
    </Stack>
  );
};

const ExploreSection = () => {
  const colors = useColorModeColors();
  return (
    <Stack
      as="section"
      flexDirection="column"
      textAlign="left"
      spacing="4"
      p={10}
      background={colors.highlightBackground}
      color={colors.highlightForeground}
      w="container.md"
    >
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
        SciX covers and unifies the fields of Earth Science, Planetary Science, Astrophysics, and Heliophysics. It will
        also cover NASA funded research in Biological and Physical Sciences.
      </Text>
    </Stack>
  );
};

const DiscoverSection = () => {
  return (
    <Stack as="section" flexDirection="column" textAlign="left" spacing="4" w="container.md">
      <Heading as="h3">
        <Text fontWeight="thin">DISCOVER</Text>
        <Text fontWeight="bold">Open Science</Text>
      </Heading>
      <Flex>
        <Text fontSize="xl" py="4" pr="4">
          SciX is part of the NASA Open Source Science Initiative. SciX supports open science principles, expanding
          access & accelerating scientific discovery for societal benefit.
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
  );
};

const QuickStartSection = forwardRef((_prop, ref) => {
  const colors = useColorModeColors();
  return (
    <Stack
      as="section"
      flexDirection="column"
      textAlign="left"
      spacing="8"
      ref={ref}
      p={10}
      background={colors.highlightBackground}
      color={colors.highlightForeground}
      w="container.md"
    >
      <Heading as="h3">
        <Text fontWeight="thin">NEW USER</Text>
        <Text fontWeight="bold">Quick Start Guide</Text>
      </Heading>
      <Text fontSize="xl">
        SciX has a user-friendly search interface. New users will have no trouble jumping in to explore.
      </Text>
      <Text fontSize="xl">
        Use the{' '}
        <SimpleLink href="/scixhelp/quickstart-scix/searching-for-paper" display="inline" isExternal newTab>
          quick start guide
        </SimpleLink>{' '}
        to start your search of the portal and find out where to go with any questions about advanced tools and
        features.
      </Text>
    </Stack>
  );
});

const ExamplesSection = forwardRef((_prop, ref) => {
  return (
    <Stack as="section" flexDirection="column" textAlign="center" spacing="4" ref={ref}>
      <Heading as="h3">
        <Text fontWeight="thin">Search Examples</Text>
      </Heading>
      <SearchExamples />
    </Stack>
  );
});

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
