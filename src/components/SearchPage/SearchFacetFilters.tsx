import dynamic from 'next/dynamic';
import { RefObject, useState } from 'react';

import {
  Box,
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Heading,
  Icon,
  IconButton,
  Portal,
  Tooltip,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/20/solid';

import { IADSApiSearchParams } from '@/api/search/types';
import { ISearchFacetsProps } from '@/components/SearchFacet';
import { IYearHistogramSliderProps } from '@/components/SearchFacet/YearHistogramSlider';
import { AppState, useStore } from '@/store';

const YearHistogramSlider = dynamic<IYearHistogramSliderProps>(
  () =>
    import('@/components/SearchFacet/YearHistogramSlider').then((mod) => ({
      default: mod.YearHistogramSlider,
    })),
  { ssr: false },
);

const SearchFacets = dynamic<ISearchFacetsProps>(
  () =>
    import('@/components/SearchFacet').then((mod) => ({
      default: mod.SearchFacets,
    })),
  { ssr: false },
);

const selectors = {
  showFilters: (state: AppState) => state.settings.searchFacets.open,
  toggleSearchFacetsOpen: (state: AppState) => state.toggleSearchFacetsOpen,
  resetSearchFacets: (state: AppState) => state.resetSearchFacets,
};

export interface ISearchFacetFiltersProps {
  histogramContainerRef?: RefObject<HTMLDivElement>;
  onSearchFacetSubmission: (queryUpdates: Partial<IADSApiSearchParams>) => void;
}

export const SearchFacetFilters = (props: ISearchFacetFiltersProps) => {
  const { onSearchFacetSubmission, histogramContainerRef } = props;
  const showFilters = useStore(selectors.showFilters);
  const handleToggleFilters = useStore(selectors.toggleSearchFacetsOpen);
  const handleResetFilters = useStore(selectors.resetSearchFacets);
  const [histogramExpanded, setHistogramExpanded] = useState(false);

  const isMobile = useBreakpointValue({ base: true, lg: false });
  const { isOpen: isFacetOpen, onClose: onCloseFacet, onOpen: onOpenFacet } = useDisclosure();

  if (isMobile) {
    return (
      <>
        <Box as="aside" aria-labelledby="search-facets">
          <Portal appendToParentPortal>
            <Button
              position="fixed"
              transform="rotate(90deg)"
              transformOrigin="bottom left"
              borderBottomRadius="none"
              size="xs"
              type="button"
              onClick={onOpenFacet}
              top="240px"
              left="0"
              id="tour-search-facets"
            >
              Show Filters
            </Button>
          </Portal>
        </Box>
        <Drawer placement="left" onClose={onCloseFacet} isOpen={isFacetOpen}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerBody>
              <SearchFacets onQueryUpdate={onSearchFacetSubmission} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  if (showFilters) {
    return (
      <Flex as="aside" aria-labelledby="search-facets" minWidth="250px" direction="column" id="tour-search-facets">
        <a className="skip-link" href="#results">
          Skip to search results
        </a>
        <Flex mb={5}>
          <Heading as="h2" id="search-facets" fontSize="normal" flex="1">
            Filters
          </Heading>
          <Tooltip label="Reset filters">
            <IconButton
              variant="unstyled"
              icon={
                <Center>
                  <Icon as={ArrowPathIcon} />
                </Center>
              }
              size="xs"
              fontSize="xl"
              aria-label="reset filters"
              type="button"
              onClick={handleResetFilters}
              _hover={{
                backgroundColor: 'blue.50',
                border: 'solid 1px gray.400',
              }}
            />
          </Tooltip>
          <Tooltip label="Hide filters">
            <IconButton
              variant="unstyled"
              icon={
                <Center>
                  <Icon as={XMarkIcon} />
                </Center>
              }
              size="xs"
              fontSize="2xl"
              aria-label="hide filters"
              type="button"
              onClick={handleToggleFilters}
              fontWeight="normal"
              _hover={{
                backgroundColor: 'blue.50',
                border: 'solid 1px gray.400',
              }}
            />
          </Tooltip>
        </Flex>
        {histogramExpanded ? (
          <Portal containerRef={histogramContainerRef}>
            <Box mt={10}>
              <YearHistogramSlider
                onQueryUpdate={onSearchFacetSubmission}
                onExpand={() => setHistogramExpanded((state) => !state)}
                expanded={true}
                width={props.histogramContainerRef?.current?.offsetWidth || 200}
                height={125}
              />
            </Box>
          </Portal>
        ) : (
          <YearHistogramSlider
            onQueryUpdate={onSearchFacetSubmission}
            onExpand={() => setHistogramExpanded((state) => !state)}
            expanded={false}
            width={200}
            height={125}
          />
        )}
        <SearchFacets onQueryUpdate={onSearchFacetSubmission} />
      </Flex>
    );
  }
  return (
    <>
      <Portal appendToParentPortal>
        <Button
          position="absolute"
          transform="rotate(90deg)"
          transformOrigin="bottom left"
          borderBottomRadius="none"
          size="xs"
          type="button"
          onClick={handleToggleFilters}
          top="240px"
          left="0"
          id="tour-search-facets"
        >
          Show Filters
        </Button>
      </Portal>
    </>
  );
};
