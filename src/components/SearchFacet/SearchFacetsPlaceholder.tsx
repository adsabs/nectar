import { Box, Flex, Skeleton, SkeletonText, Stack } from '@chakra-ui/react';
import { Fragment, ReactElement, ReactNode } from 'react';
import { range } from 'ramda';

export const FACET_COLUMN_WIDTH = '250px';

export interface ISearchFacetsColumnProps {
  isOpen?: boolean;
  testId?: string;
  children: ReactNode;
}

export const SearchFacetsColumn = ({ isOpen = true, testId, children }: ISearchFacetsColumnProps): ReactElement => (
  <Flex
    as="aside"
    aria-labelledby="search-facets"
    display={{ base: 'none', lg: 'flex' }}
    direction="column"
    minWidth={{ base: 0, lg: isOpen ? FACET_COLUMN_WIDTH : 0 }}
    data-testid={testId}
  >
    {children}
  </Flex>
);

export interface FacetSkeletonSection {
  label: string;
  rows: number;
}

export const FACET_SKELETON_SECTIONS: readonly FacetSkeletonSection[] = [
  { label: 'author', rows: 10 },
  { label: 'collections', rows: 4 },
  { label: 'refereed', rows: 2 },
  { label: 'institutions', rows: 0 },
  { label: 'award', rows: 0 },
  { label: 'keywords', rows: 0 },
  { label: 'publications', rows: 0 },
  { label: 'bibgroups', rows: 0 },
  { label: 'simbad', rows: 0 },
  { label: 'ned', rows: 0 },
  { label: 'data', rows: 0 },
  { label: 'vizier', rows: 0 },
  { label: 'pubtype', rows: 0 },
  { label: 'uat', rows: 0 },
];

const SECTIONS_WITHOUT_FOOTER = new Set(['refereed']);

const HEADING_HEIGHT = 24;
const HISTOGRAM_HEIGHT = 213;
const SHOW_HIDDEN_FILTERS_HEIGHT = 17;
const SECTION_GAP = '4px';
const EXPANDED_SECTION_HEADER_HEIGHT = 49;
const FACET_ROW_HEIGHT = 29;
const EXPANDED_SECTION_FOOTER_HEIGHT = 32;
const COLLAPSED_SECTION_HEIGHT = 40;

const FacetSectionSkeleton = ({ section }: { section: FacetSkeletonSection }): ReactElement => {
  if (section.rows === 0) {
    return (
      <Box height={`${COLLAPSED_SECTION_HEIGHT}px`} data-testid="facet-section-skeleton">
        <Skeleton height={4} width="70%" />
      </Box>
    );
  }

  const hasFooter = !SECTIONS_WITHOUT_FOOTER.has(section.label);

  return (
    <Box data-testid="facet-section-skeleton">
      <Box height={`${EXPANDED_SECTION_HEADER_HEIGHT}px`}>
        <Skeleton height={4} width="70%" />
      </Box>
      {range(0, section.rows).map((row) => (
        <Box key={row} height={`${FACET_ROW_HEIGHT}px`} data-testid="facet-row-skeleton">
          <SkeletonText noOfLines={1} width="90%" skeletonHeight={2} />
        </Box>
      ))}
      {hasFooter && (
        <Box height={`${EXPANDED_SECTION_FOOTER_HEIGHT}px`}>
          <Skeleton height={3} width="40%" />
        </Box>
      )}
    </Box>
  );
};

export const SearchFacetsSkeletonContent = (): ReactElement => (
  <Fragment>
    <Box height={`${HEADING_HEIGHT}px`} data-testid="facet-heading-skeleton">
      <Skeleton height={4} width="40%" />
    </Box>
    <Box height={`${HISTOGRAM_HEIGHT}px`} data-testid="facet-histogram-skeleton">
      <Skeleton height="full" width="full" />
    </Box>
    <Stack direction="column" spacing={SECTION_GAP}>
      {FACET_SKELETON_SECTIONS.map((section) => (
        <FacetSectionSkeleton key={section.label} section={section} />
      ))}
    </Stack>
    <Box height={`${SHOW_HIDDEN_FILTERS_HEIGHT}px`}>
      <Skeleton height={3} width="50%" />
    </Box>
  </Fragment>
);

export const SearchFacetsPlaceholder = (): ReactElement => (
  <SearchFacetsColumn testId="search-facets-placeholder">
    <SearchFacetsSkeletonContent />
  </SearchFacetsColumn>
);
