import { ChevronLeftIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Skeleton,
  SkeletonProps,
  SkeletonText,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CommonError } from '@server/types';
import { MathJax } from 'better-react-mathjax';
import Head from 'next/head';
import { FC } from 'react';

import { IADSApiSearchParams, IDocsEntity } from '@/api';
import {
  AbstractSideNav,
  AbstractSources,
  CitationExporter,
  FeedbackAlert,
  LoadingMessage,
  Metatags,
  SimpleLink,
  SimpleResultListSkeleton,
} from '@/components';
import { Routes } from '@/components/AbstractSideNav/types';
import { BRAND_NAME_FULL } from '@/config';
import { makeSearchParams, unwrapStringValue } from '@/utils';

interface IAbsLayoutProps {
  doc?: IDocsEntity;
  error?: CommonError;
  titleDescription: string;
  label: string;
  params?: IADSApiSearchParams;
  isLoading?: boolean;
}

export const AbsLayout: FC<IAbsLayoutProps> = (props) => {
  const { children, doc, error, titleDescription, label, params, isLoading } = props;

  console.log('AbsLayout -> doc', doc, error);

  if (error) {
    return (
      <Stack direction="column" my={{ base: '6', lg: params ? '12' : '16' }}>
        <BackToSearchBtn params={params} />
        <Center>
          <FeedbackAlert status="error" title={error.errorMsg} description={error.friendlyMessage} />
        </Center>
      </Stack>
    );
  }

  const title = unwrapStringValue(doc?.title ?? '');

  return (
    <Stack direction="column" my={{ base: '6', lg: params ? '12' : '16' }}>
      <BackToSearchBtn params={params} />
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={6}>
        <Head>
          <title>{`${title} - ${BRAND_NAME_FULL} ${label}`}</title>
          <Metatags doc={doc} />
        </Head>
        <Stack direction="column">
          <Box display={{ base: 'none', lg: 'block' }} maxW="72">
            <AbstractSources doc={doc} style="accordion" />
          </Box>
          <AbstractSideNav doc={doc} />
        </Stack>
        <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
          <Heading as="h2" id="title" fontSize="2xl" variant="abstract">
            <Text as="span" fontSize="xl">
              {titleDescription}
            </Text>{' '}
            <Text as={MathJax} dangerouslySetInnerHTML={{ __html: title }} />
          </Heading>
          {isLoading ? <LoadingMessage message="Loading" /> : null}
          {children}
        </Stack>
      </Stack>
    </Stack>
  );
};

const BackToSearchBtn = (props: { params?: IADSApiSearchParams }) => {
  const { params } = props;

  if (!params) {
    return null;
  }

  return (
    <Flex>
      <Button
        as={SimpleLink}
        _hover={{ textDecoration: 'none' }}
        variant={'outline'}
        leftIcon={<ChevronLeftIcon />}
        fontSize="sm"
        fontWeight="normal"
        href={{ pathname: '/search', search: makeSearchParams(params) }}
      >
        Back to Results
      </Button>
    </Flex>
  );
};

export const AbsSkeleton = ({ path }: { path: string }) => {
  return (
    <Stack direction="column" my={{ base: '6', lg: '16' }}>
      <Stack direction={{ base: 'column', lg: 'row' }} spacing={6}>
        <Stack direction="column">
          <AbstractSources style="accordion" />
          <AbstractSideNav activeId={Routes[path as keyof typeof Routes]} />
        </Stack>
        <Stack direction="column" as="section" aria-labelledby="title" spacing={1} width="full">
          <Heading as="h2" id="title" fontSize="2xl" variant="abstract">
            <SkeletonText as="span" fontSize="xl" />{' '}
          </Heading>
          {path === Routes.ABSTRACT ? (
            <AbstractPageSkeleton />
          ) : path === Routes.METRICS ? (
            <MetricsSkeleton />
          ) : path === Routes.EXPORT ? (
            <Box pt="1">
              <CitationExporter singleMode />
            </Box>
          ) : path === Routes.GRAPHICS ? (
            <GraphicsPageSkeleton />
          ) : (
            <SimpleResultListSkeleton />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

const GraphicsPageSkeleton = (props: SkeletonProps) => {
  return (
    <VStack spacing="4" width="full">
      {Array.from({ length: 3 }).map(() => (
        <HStack spacing="4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Box key={index}>
              <Skeleton height="200px" width="175px" />
            </Box>
          ))}
        </HStack>
      ))}
    </VStack>
  );
};

const AbstractPageSkeleton = (props: SkeletonProps) => {
  return (
    <Box as="article" aria-labelledby="title">
      <Stack direction="column" gap={2}>
        <Skeleton height="24px" width="60%" {...props} />
        <Flex wrap="wrap" as="section" aria-labelledby="author-list">
          <Skeleton height="20px" width="80px" mr={2} {...props} />
          <Skeleton height="20px" width="80px" mr={2} {...props} />
          <Skeleton height="20px" width="80px" mr={2} {...props} />
          <Skeleton height="20px" width="80px" mr={2} {...props} />
          <Skeleton height="20px" width="80px" mr={2} {...props} />
          <Skeleton height="20px" width="60px" {...props} />
        </Flex>
        <SkeletonText mt="4" noOfLines={6} spacing="4" skeletonHeight="2" {...props} />

        <Box mt={4}>
          <Skeleton height="30px" width="100px" {...props} />
        </Box>
        <Box as="section" py="2" aria-labelledby="abstract">
          <SkeletonText mt="2" noOfLines={10} spacing="4" skeletonHeight="2" {...props} />
        </Box>

        <Box
          as="section"
          border="1px"
          borderColor="gray.50"
          borderRadius="md"
          shadow="sm"
          aria-labelledby="details"
          p={4}
        >
          <Skeleton height="24px" width="30%" mb={4} {...props} />
          <SkeletonText noOfLines={4} spacing="4" skeletonHeight="2" {...props} />
        </Box>
      </Stack>
    </Box>
  );
};
const MetricsSkeleton = () => {
  return (
    <Stack spacing={8} p={4}>
      {/* Skeleton for the Citations Section */}
      <Box>
        <Skeleton height="30px" width="60%" mb={4} />
        <Skeleton height="20px" width="30%" mb={2} />
        <SkeletonText noOfLines={2} spacing="4" skeletonHeight="2" mb={4} />
        <Skeleton height="200px" width="100%" />
      </Box>

      {/* Skeleton for the Reads Section */}
      <Box>
        <Skeleton height="30px" width="60%" mb={4} />
        <Skeleton height="20px" width="30%" mb={2} />
        <SkeletonText noOfLines={2} spacing="4" skeletonHeight="2" mb={4} />
        <Skeleton height="200px" width="100%" />
      </Box>
    </Stack>
  );
};
const ExportPageSkeleton = () => {
  return (
    <Stack spacing={6} p={4} w="full">
      {/* Skeleton for the Format Dropdown and Submit Button */}
      <Box>
        <Skeleton height="30px" width="200px" mb={4} />
        <Skeleton height="20px" width="100px" mb={4} />
        <Skeleton height="40px" width="100px" />
      </Box>

      {/* Skeleton for the Download and Copy Buttons */}
      <Stack direction="row" spacing={4}>
        <Skeleton height="40px" width="150px" />
        <Skeleton height="40px" width="150px" />
      </Stack>

      {/* Skeleton for the Citation Preview */}
      <Box border="1px" borderColor="gray.200" p={4} borderRadius="md">
        <SkeletonText noOfLines={8} spacing="4" />
      </Box>
    </Stack>
  );
};
