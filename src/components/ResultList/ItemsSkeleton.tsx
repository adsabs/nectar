import { Box, Checkbox, Flex, Skeleton, SkeletonText, Stack, Text } from '@chakra-ui/react';
import { range } from 'ramda';
import { ReactElement } from 'react';
import { useColorModeColors } from '@/lib/useColorModeColors';
import {
  RESULT_ITEM_ABSTRACT_TOGGLE_HEIGHT,
  RESULT_ITEM_AUTHORS_HEIGHT,
  RESULT_ITEM_HEIGHT,
  RESULT_ITEM_META_ROW_HEIGHT,
  RESULT_ITEM_PUB_ROW_HEIGHT,
  RESULT_ITEM_TITLE_HEIGHT,
} from '@/components/ResultList/itemHeight';

export interface ISkeletonProps {
  count: number;
  indexStart?: number;
}

export const ItemsSkeleton = (props: ISkeletonProps): ReactElement => {
  const { count = 0, indexStart = 0 } = props;
  const colors = useColorModeColors();

  return (
    <>
      {range(0, count).map((i) => (
        <Flex
          data-testid="item-skeleton"
          direction="row"
          as="article"
          border="1px"
          borderColor={colors.border}
          mb={1}
          borderRadius="md"
          minH={RESULT_ITEM_HEIGHT}
          key={i.toString()}
        >
          <Flex
            direction="row"
            backgroundColor={colors.panel}
            justifyContent="center"
            alignItems="center"
            mr="2"
            px="2"
            borderLeftRadius="md"
            w="64px"
          >
            <Text display={{ base: 'none', md: 'initial' }} mr={1}>
              {(indexStart + i + 1).toLocaleString()}
            </Text>
            <Checkbox isDisabled size="md" aria-hidden="true" tabIndex={-1} />
          </Flex>
          <Stack direction="column" width="full" spacing={0} mx={3} mt={2}>
            <Stack direction="column" spacing={1} minH={RESULT_ITEM_TITLE_HEIGHT}>
              <Skeleton height={3} width="100%" />
              <Skeleton height={3} width="60%" />
            </Stack>
            <Box minH={RESULT_ITEM_AUTHORS_HEIGHT}>
              <SkeletonText width="75%" noOfLines={1} />
            </Box>
            <Box minH={RESULT_ITEM_PUB_ROW_HEIGHT} mt={0.5}>
              <SkeletonText width="50%" noOfLines={1} />
            </Box>
            <Box minH={RESULT_ITEM_META_ROW_HEIGHT} mt={0.5}>
              <SkeletonText width="40%" noOfLines={1} />
            </Box>
            <Box minH={RESULT_ITEM_ABSTRACT_TOGGLE_HEIGHT} />
          </Stack>
        </Flex>
      ))}
    </>
  );
};
