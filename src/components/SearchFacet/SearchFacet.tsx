import { FacetField, IADSApiSearchParams, IFacetCountsFields } from '@api';
import { ChevronDownIcon, ChevronRightIcon, DragHandleIcon } from '@chakra-ui/icons';
import {
  AccordionItemProps,
  Box,
  Button,
  HStack,
  Icon,
  IconButton,
  List,
  ListItem,
  Text,
  Tooltip,
  useBoolean,
  useDisclosure,
} from '@chakra-ui/react';
import { DndContext, DragEndEvent, MouseSensor, useSensor } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExclamationCircleIcon, EyeIcon, EyeOffIcon } from '@heroicons/react/solid';
import { AppState, useStore, useStoreApi } from '@store';
import { prop, sort, sortBy } from 'ramda';
import { CSSProperties, MouseEventHandler, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { facetConfig } from './config';
import { applyFiltersToQuery } from './helpers';
import { OnFilterArgs, SearchFacetTree } from './SearchFacetTree';
import { FacetLogic, SearchFacetID } from './types';

export interface ISearchFacetProps extends AccordionItemProps {
  field: FacetField;
  property?: keyof IFacetCountsFields;
  hasChildren?: boolean;
  facetQuery?: string;
  label: string;
  storeId: SearchFacetID;
  logic: {
    single: FacetLogic[];
    multiple: FacetLogic[];
  };
  defaultIsOpen?: boolean;
  filter?: string[];
  onQueryUpdate: (queryUpdates: Partial<IADSApiSearchParams>) => void;
}

export const SearchFacet = (props: ISearchFacetProps): ReactElement => {
  const store = useStoreApi();
  const setFacetState = useStore((state) => state.setSearchFacetState);
  const facets = useStore((state) => state.settings.searchFacets.order);
  const hiddenFacets = useStore(useCallback((state) => state.getHiddenSearchFacets(), [facets]));
  const hideFacet = useStore((state) => state.hideSearchFacet);
  const showFacet = useStore((state) => state.showSearchFacet);
  const { label, field, storeId, property, hasChildren, logic, facetQuery, filter, onQueryUpdate } = props;
  const { listeners, attributes, setNodeRef, setActivatorNodeRef, transform, transition, isSorting } = useSortable({
    id: storeId,
    strategy: verticalListSortingStrategy,
  });

  const hidden = useMemo(() => {
    return hiddenFacets.findIndex((id) => id === storeId) !== -1;
  }, [hiddenFacets, storeId]);

  const facetState = useStore(useCallback((state: AppState) => state.getSearchFacetState(storeId), [storeId]));

  const { isOpen, onToggle, onClose } = useDisclosure({
    id: field,
    onOpen: () => {
      setFacetState(storeId, { expanded: true });
      setHasError(false);
    },
    onClose: () => {
      setFacetState(storeId, { expanded: false });
    },
    isOpen: facetState.expanded,
  });
  const [hasError, setHasError] = useState(false);

  const handleOnFilter = (filterArgs: OnFilterArgs) => {
    const query = store.getState().latestQuery;
    onQueryUpdate(applyFiltersToQuery({ ...filterArgs, query }));
  };

  const handleHideClick = () => {
    if (hidden) {
      showFacet(storeId);
    } else {
      hideFacet(storeId);
    }
  };

  const handleOnError = () => {
    setHasError(true);
    onClose();
  };

  useEffect(() => {
    if (isSorting) {
      onClose();
    }
  }, [isSorting]);

  const [showHideBtn, setShowHideBtn] = useBoolean(false);

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      my="1"
      onMouseEnter={setShowHideBtn.on}
      onFocus={setShowHideBtn.on}
      onMouseLeave={setShowHideBtn.off}
    >
      <h2>
        <HStack spacing={0}>
          <Button
            w="full"
            variant="outline"
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
            onClick={onToggle}
            borderColor="blue.100"
            borderBottom={isOpen ? 'none' : 'auto'}
            borderBottomRadius={isOpen ? 0 : 'md'}
            borderRight={showHideBtn && !isOpen ? 'none' : 'auto'}
            borderRightRadius={showHideBtn && !isOpen ? 0 : 'md'}
            borderBottomRightRadius={showHideBtn || isOpen ? 0 : 'md'}
            mb="0"
            px="0.5"
          >
            {hidden ? <Box mr={3}></Box> : <DragHandleIcon mr="1" />}
            <HStack flex="1" textAlign="left">
              <Text flex="1">{label}</Text>
              {hasError && (
                <Tooltip label="Error loading facet, try again later">
                  <Icon as={ExclamationCircleIcon} color="red.500" />
                </Tooltip>
              )}
            </HStack>

            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </Button>
          {showHideBtn && !isOpen && (
            <IconButton
              onMouseEnter={setShowHideBtn.on}
              onFocus={setShowHideBtn.on}
              onBlur={setShowHideBtn.off}
              onMouseLeave={setShowHideBtn.off}
              borderLeft="none"
              borderLeftRadius={0}
              icon={
                hidden ? (
                  <EyeIcon width="12" style={{ margin: 0, padding: 0, border: 'none' }} />
                ) : (
                  <EyeOffIcon width="12" style={{ margin: 0, padding: 0, border: 'none' }} />
                )
              }
              onClick={handleHideClick}
              border="solid 1px"
              borderColor="blue.100"
              size="xs"
              variant="ghost"
              aria-label={hidden ? 'show facet' : 'hide facet'}
              m={0}
              height={8}
              px={2}
            />
          )}
        </HStack>
      </h2>
      <Box
        pl="2"
        py="1"
        pr="1"
        border={isOpen && 'solid 1px'}
        borderColor={isOpen && 'blue.100'}
        borderTop="none"
        borderBottomRadius="md"
        mt="0"
      >
        {isOpen && (
          <SearchFacetTree
            label={label}
            field={field}
            property={property}
            hasChildren={hasChildren}
            logic={logic}
            facetQuery={facetQuery}
            filter={filter}
            onFilter={handleOnFilter}
            onError={handleOnError}
          />
        )}
      </Box>
    </ListItem>
  );
};

export interface ISearchFacetsProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
}

export const SearchFacets = (props: ISearchFacetsProps) => {
  const { onQueryUpdate } = props;
  const facets = useStore((state) => state.settings.searchFacets.order);
  const setFacets = useStore((state) => state.setSearchFacetOrder);
  const resetFacets = useStore((state) => state.resetSearchFacets);
  const hidden = useStore(useCallback((state) => state.getHiddenSearchFacets(), [facets]));
  const toggleOpenAllFilters = useStore((state) => state.toggleSearchFacetsOpen);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    if (facets.length === 0) {
      toggleOpenAllFilters(false);
      resetFacets();
    }
  }, [facets]);

  const toggleShowHidden: MouseEventHandler = () => {
    setShowHidden(!showHidden);
  };

  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active?.id !== over?.id) {
      const oldIndex = facets.indexOf(active?.id as SearchFacetID);
      const newIndex = facets.indexOf(over?.id as SearchFacetID);
      setFacets(arrayMove(facets, oldIndex, newIndex));
    }
  };

  const list = useMemo(() => {
    return facets.map((facetId) => {
      const facetProps = facetConfig[facetId];
      return <SearchFacet {...facetProps} key={facetProps.storeId} onQueryUpdate={onQueryUpdate} hidden={false} />;
    });
  }, [facets, onQueryUpdate]);

  const hiddenList = useMemo(() => {
    const facetProps = hidden.map((id) => facetConfig[id]).sort((a, b) => a.label.localeCompare(b.label));
    return facetProps.map((facetProp) => {
      return <SearchFacet {...facetProp} key={facetProp.storeId} onQueryUpdate={onQueryUpdate} hidden={true} />;
    });
  }, [hidden, onQueryUpdate]);

  return (
    <>
      <DndContext
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        sensors={[mouseSensor]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={facets} strategy={verticalListSortingStrategy}>
          <List>{list}</List>
        </SortableContext>
      </DndContext>

      {hiddenList.length > 0 && (
        <Button variant="link" onClick={toggleShowHidden} type="button">
          {showHidden ? 'Hide hidden filters' : 'Show hidden filters'} {`(${hiddenList.length})`}
        </Button>
      )}

      {showHidden && <List>{hiddenList}</List>}
    </>
  );
};
