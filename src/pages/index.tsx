import { IADSApiSearchParams } from '@/api/search/types';
import { DatabaseEnum, IADSApiUserDataResponse } from '@/api/user/types';
import {
  Box,
  Center,
  Flex,
  Heading,
  Icon,
  Stack,
  Stat,
  StatGroup,
  StatHelpText,
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
import {
  ChatBubbleBottomCenterIcon,
  DocumentIcon,
  FolderIcon,
  PlayCircleIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import { ExternalLinkIcon } from '@chakra-ui/icons';

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
    <Flex direction="column" aria-labelledby="form-title" my={8} alignItems="center" w="full">
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
        <input type="hidden" name="sort" value={normalizeSolrSort(sort)} />
        <input type="hidden" name="p" value="1" />
      </form>
      <Stats />
      <SimpleLink href="https://www.youtube.com/watch?v=sgJ-LolRLu8&ab_channel=ScienceExplorer%28SciX%29">
        <Box
          position="relative"
          mt={10}
          w="80%"
          mx="auto"
          borderRadius="lg"
          overflow="hidden"
          boxShadow="lg"
          role="group" // for hover effects
          cursor="pointer"
          _hover={{ transform: 'scale(1.02)', boxShadow: 'xl' }}
          transition="all 0.2s"
        >
          <Image
            src="/images/Welcome to SciX SciXComm YT thumbnail.png"
            alt="Click to open SciX introduction video"
            width={1200}
            height={675} // 16:9 aspect ratio
            style={{ width: '100%', height: 'auto' }}
          />

          {/* Play button overlay */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            opacity={0.9}
            _groupHover={{ opacity: 1 }}
          >
            <Icon as={PlayCircleIcon} w={24} h={24} color="red.500" />
          </Box>

          {/* Gradient caption bar */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            w="full"
            bgGradient="linear(to-t, blackAlpha.700, transparent)"
            color="white"
            p={2}
            fontSize="sm"
          >
            Click to learn more about SciX <ExternalLinkIcon />
          </Box>
        </Box>
      </SimpleLink>
    </Flex>
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
    <StatGroup
      borderWidth={0.5}
      borderRadius={5}
      p={4}
      mt={5}
      as="section"
      aria-label="Stats Section"
      alignItems="center"
      w="100%"
    >
      <Stat textAlign="center">
        <StatLabel color="brand.200">
          <Icon as={FolderIcon} w={50} h={50} />
        </StatLabel>
        <StatNumber color="brand.200">30M+</StatNumber>
        <StatHelpText>Scientific Records</StatHelpText>
      </Stat>
      <Stat textAlign="center">
        <StatLabel color="brand.300">
          <Icon as={ChatBubbleBottomCenterIcon} w={50} h={50} />
        </StatLabel>
        <StatNumber color="brand.300">300M+</StatNumber>
        <StatHelpText>Citations</StatHelpText>
      </Stat>
      <Stat textAlign="center">
        <StatLabel color="brand.400">
          <Icon as={DocumentIcon} w={50} h={50} />
        </StatLabel>
        <StatNumber color="brand.400">~8000</StatNumber>
        <StatHelpText>Peer Reviewed Journals</StatHelpText>
      </Stat>
      <Stat textAlign="center">
        <StatLabel color="brand.500">
          <Icon as={UserIcon} w={50} h={50} />
        </StatLabel>
        <StatNumber color="brand.500">16M+</StatNumber>
        <StatHelpText>Annual Users</StatHelpText>
      </Stat>
    </StatGroup>
  );
};
