import { Box, Center, Flex, Heading, Stack, Text, VisuallyHidden } from '@chakra-ui/react';
import { ISearchExamplesProps, Pager, SearchBar, SearchExamplesPlaceholder, SimpleLink } from '@components';
import { useStore, useStoreApi } from '@store';
import { makeSearchParams } from '@utils';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';
import { useIntermediateQuery } from '@lib/useIntermediateQuery';
import Image from 'next/image';

const SearchExamples = dynamic<ISearchExamplesProps>(
  () => import('@components/SearchExamples').then((m) => m.SearchExamples),
  { ssr: false, loading: () => <SearchExamplesPlaceholder /> },
);

const HomePage: NextPage = () => {
  const store = useStoreApi();
  const submitQuery = useStore((state) => state.submitQuery);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { clearQuery, updateQuery } = useIntermediateQuery();

  // clear search on mount
  useEffect(() => clearQuery(), []);

  /**
   * update route and start searching
   */
  const handleOnSubmit: ChangeEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const { sort } = store.getState().query;
      const query = new FormData(e.currentTarget).get('q') as string;

      if (query && query.trim().length > 0) {
        updateQuery(query);
        setIsLoading(true);
        submitQuery();
        void router.push({ pathname: '/search', search: makeSearchParams({ q: query, sort, p: 1 }) });
      }
    },
    [router, store, submitQuery, updateQuery],
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
      </form>
    </Box>
  );
};

export default HomePage;
export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';

const Carousel = () => {
  return (
    <Pager
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
                <iframe
                  width="560"
                  height="315"
                  src="https://www.youtube-nocookie.com/embed/LeTFmhmPjs0?si=RtpASLVZtKqbxOOr"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </Center>
              <Text fontSize="xl">
                Learn more about the SciX digital library and how it can support your scientific research in this
                welcome video and brief user tutorial from Dr. Stephanie Jarmak.
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
                NASA SciX covers and unifies the fields of Earth Science, Planetary Science, Astrophysics, and
                Heliophysics. It will also cover NASA funded research in Biological and Physical Sciences.
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
