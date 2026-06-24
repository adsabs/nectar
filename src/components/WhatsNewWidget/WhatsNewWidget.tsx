import { Box, Flex, Heading, Link, Skeleton, Stack, StackDivider, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useColorModeColors } from '@/lib/useColorModeColors';
import type { WhatsNewItem, WhatsNewResponse } from '@/pages/api/whats-new';

const BLOG_URL = 'https://scixplorer.org/scixblog/';
const ITEM_COUNT = 5;
const STALE_MS = 60 * 60 * 1000;

const fetchFeed = async (): Promise<WhatsNewResponse> => {
  const res = await fetch('/api/whats-new');
  if (!res.ok) {
    throw new Error('feed unavailable');
  }
  return res.json() as Promise<WhatsNewResponse>;
};

const formatDate = (raw: string): string => {
  if (!raw) {
    return '';
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

interface FeedItemProps {
  item: WhatsNewItem;
  linkColor: string;
  subtextColor: string;
}

const FeedItem = ({ item, linkColor, subtextColor }: FeedItemProps) => (
  <Box py={1}>
    <Link
      href={item.link}
      color={linkColor}
      fontWeight="semibold"
      fontSize="sm"
      lineHeight="short"
      display="block"
      _hover={{ textDecoration: 'underline' }}
    >
      <Text noOfLines={2} title={item.title}>
        {item.title}
      </Text>
    </Link>
    {item.summary && (
      <Text fontSize="xs" color={subtextColor} mt={1} noOfLines={2}>
        {item.summary}
      </Text>
    )}
    {item.pubDate && (
      <Text fontSize="xs" color={subtextColor} mt={1}>
        {formatDate(item.pubDate)}
      </Text>
    )}
  </Box>
);

export const WidgetRow = ({ children }: { children: ReactNode }) => (
  <Flex direction={{ base: 'column', md: 'row' }} gap={4} w="87%" mt={6} alignItems="flex-start">
    {children}
  </Flex>
);

export const WhatsNewWidget = () => {
  const colors = useColorModeColors();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['whats-new'],
    queryFn: fetchFeed,
    staleTime: STALE_MS,
    retry: false,
  });

  const items = data?.items ?? [];

  return (
    <Box borderWidth={1} borderRadius="md" p={4} bg="transparent" borderColor={colors.border} w="full">
      <Heading as="h3" size="sm" mb={3} color={colors.text}>
        What&#39;s New
      </Heading>

      {isLoading ? (
        <Stack spacing={3} aria-busy="true" aria-label="Loading updates">
          {Array.from({ length: ITEM_COUNT }).map((_, i) => (
            <Skeleton key={i} height="40px" borderRadius={4} />
          ))}
        </Stack>
      ) : isError || items.length === 0 ? (
        <Text fontSize="sm" color={colors.lightText}>
          No updates available.
        </Text>
      ) : (
        <Stack spacing={0} divider={<StackDivider borderColor={colors.border} />}>
          {items.map((item, i) => (
            <FeedItem key={i} item={item} linkColor={colors.link} subtextColor={colors.lightText} />
          ))}
          <StackDivider borderColor={colors.border} />
        </Stack>
      )}

      {!isLoading && (
        <Link href={BLOG_URL} isExternal fontSize="sm" color={colors.link} display="block" mt={3}>
          See more
        </Link>
      )}
    </Box>
  );
};
