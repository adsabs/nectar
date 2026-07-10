import { Button, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { FireIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/20/solid';
import { SimpleLink } from '../SimpleLink';
import { IADSApiSearchParams } from '@/api/search/types';
import { makeSearchParams } from '@/utils/common/search';
import { useMemo } from 'react';

export const FeaturedPapers = ({ query }: { query: IADSApiSearchParams }) => {
  const topPaperHref = useMemo(() => {
    const params = makeSearchParams({
      ...query,
      sort: ['citation_count desc'],
    });
    return `/search?${params}`;
  }, [query]);

  const mostRecentHref = useMemo(() => {
    const params = makeSearchParams({
      ...query,
      sort: ['date desc'],
    });
    return `/search?${params}`;
  }, [query]);

  const trendingHref = useMemo(() => {
    const params = makeSearchParams({
      ...query,
      q: `trending(${query.q})`,
      sort: ['score desc'],
    });
    return `/search?${params}`;
  }, [query]);

  return (
    <Flex width="full">
      <Button
        as={SimpleLink}
        href={topPaperHref}
        newTab
        variant="ghost"
        borderWidth={1}
        borderRightRadius={0}
        borderRightWidth={0}
        flexGrow={1}
        borderLeftRadius="md"
        h="20"
        justifyContent="center"
        alignItems="center"
      >
        <SimpleLink href={topPaperHref} newTab>
          <VStack>
            <Icon as={FireIcon} width={6} height={6} />
            <Text>Top Papers</Text>
          </VStack>
        </SimpleLink>
      </Button>
      <Button
        as={SimpleLink}
        href={mostRecentHref}
        newTab
        variant="ghost"
        borderWidth={1}
        borderRightRadius={0}
        borderRightWidth={0}
        borderLeftRadius={0}
        flexGrow={1}
        h="20"
        justifyContent="center"
        alignItems="center"
      >
        <VStack>
          <Icon as={ClockIcon} width={6} height={6} />
          <Text>Most Recent</Text>
        </VStack>
      </Button>
      <Button
        as={SimpleLink}
        variant="ghost"
        href={trendingHref}
        newTab
        borderWidth={1}
        flexGrow={1}
        borderRightRadius="md"
        borderLeftRadius={0}
        h="20"
        justifyContent="center"
        alignItems="center"
      >
        <VStack>
          <Icon as={ArrowTrendingUpIcon} width={6} height={6} />
          <Text>Trending</Text>
        </VStack>
      </Button>
      {/* <Flex borderWidth={1} flexGrow={1} borderRightRadius="md" h="20" justifyContent="center" alignItems="center">
        <SimpleLink href="" newTab>
          <HStack>
            <Icon as={TagIcon} width={6} height={6} />
            <Text>Explore by UAT Keywords</Text>
          </HStack>
        </SimpleLink>
      </Flex> */}
    </Flex>
  );
};
