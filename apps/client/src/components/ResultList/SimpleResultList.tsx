import { Flex, Skeleton, SkeletonText, Stack, VisuallyHidden } from '@chakra-ui/react';
import PT from 'prop-types';
import { HTMLAttributes, ReactElement } from 'react';

import { IDocsEntity } from '@/api';
import { APP_DEFAULTS } from '@/config';
import { useIsClient } from '@/lib/useIsClient';

import { Item } from './Item';
import { useHighlights } from './useHighlights';

export interface ISimpleResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  indexStart?: number;
  hideCheckboxes?: boolean;
  showOrcidAction?: boolean;
  hideActions?: boolean;
  allowHighlight?: boolean;
  useNormCite?: boolean;
  isLoading?: boolean;
}

const propTypes = {
  docs: PT.arrayOf(PT.object),
  indexStart: PT.number,
  hideCheckboxes: PT.bool,
};

export const SimpleResultList = (props: ISimpleResultListProps): ReactElement => {
  const {
    docs = [],
    hideCheckboxes = false,
    indexStart = 0,
    hideActions = false,
    allowHighlight = true,
    useNormCite = false,
    isLoading = false,
    ...divProps
  } = props;

  const isClient = useIsClient();
  const start = indexStart + 1;

  const { highlights, showHighlights, isFetchingHighlights } = useHighlights();

  if (isLoading) {
    return <SimpleResultListSkeleton />;
  }

  return (
    <Flex
      as="section"
      aria-label="Results"
      direction="column"
      aria-labelledby="results-title"
      id="results"
      {...divProps}
    >
      <VisuallyHidden as="h2" id="results-title">
        Results
      </VisuallyHidden>
      {docs.map((doc, index) => (
        <Item
          doc={doc}
          key={doc.bibcode}
          index={start + index}
          hideCheckbox={!isClient ? true : hideCheckboxes}
          hideActions={hideActions}
          showHighlights={allowHighlight && showHighlights}
          highlights={highlights?.[index] ?? []}
          isFetchingHighlights={allowHighlight && isFetchingHighlights}
          useNormCite={useNormCite}
        />
      ))}
    </Flex>
  );
};

SimpleResultList.propTypes = propTypes;

export const SimpleResultListSkeleton = (props: { items?: number }) => {
  const { items = APP_DEFAULTS.RESULT_PER_PAGE } = props;

  return (
    <Flex direction="column" w="full">
      {Array.from({ length: items }).map((_, idx) => (
        <Flex
          key={`skel_${idx}`}
          direction="row"
          as="article"
          border="1px"
          borderColor="gray.200"
          mb={1}
          borderRadius="md"
        >
          <Flex
            direction="row"
            backgroundColor="gray.100"
            justifyContent="center"
            alignItems="center"
            mr="2"
            px="2"
            borderLeftRadius="md"
            w="64px"
          >
            <Skeleton height="15px" width="30px" />
          </Flex>
          <Stack direction="column" width="full" spacing={0} mx={3} mt={2}>
            <Flex justifyContent="space-between">
              <Skeleton height="15px" width="60%" />
              <Flex alignItems="start" ml={1}>
                <Skeleton height="15px" width="20px" />
              </Flex>
            </Flex>
            <Flex direction="column" mt={2}>
              <Skeleton height="12px" width="80%" />
              <SkeletonText mt="2" noOfLines={2} spacing="2" skeletonHeight="2" />
              <Skeleton height="12px" width="40%" my="2" />
            </Flex>
          </Stack>
        </Flex>
      ))}
    </Flex>
  );
};
