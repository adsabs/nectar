import { FacetField, IADSApiSearchParams, IFacetCountsFields } from '@api';
import { DragHandleIcon } from '@chakra-ui/icons';
import {
  AccordionItemProps,
  Box,
  Button,
  HStack,
  Icon,
  List,
  ListItem,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { Toggler } from '@components/Toggler';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  useDroppable,
  useSensor,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExclamationCircleIcon } from '@heroicons/react/solid';
import { AppState, useStore, useStoreApi } from '@store';
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
    hidden ? showFacet(storeId) : hideFacet(storeId);
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

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <ListItem ref={setNodeRef} style={style} my={0} w="64">
      <h2>
        <HStack spacing={0}>
          <Button
            w="full"
            variant="outline"
            {...attributes}
            {...listeners}
            ref={setActivatorNodeRef}
            onClick={onToggle}
            borderColor="gray.300"
            borderBottom={isOpen ? 'none' : 'auto'}
            borderBottomRadius={isOpen ? 0 : 'md'}
            borderRightRadius={0}
            borderRight="none"
            mb="0"
            px="0.5"
          >
            <DragHandleIcon mr="1" color="gray.400" fontSize="md" />
            <Toggler isToggled={isOpen} fontSize="2xl" color="gray.600" />
            <HStack flex="1" textAlign="left" mx="1">
              <Text flex="1" fontSize="md" fontWeight="medium" color="gray.600">
                {label}
              </Text>
              {hasError && (
                <Tooltip label="Error loading facet, try again later">
                  <Icon as={ExclamationCircleIcon} color="red.500" />
                </Tooltip>
              )}
            </HStack>
          </Button>
          <Button
            onClick={handleHideClick}
            border="solid 1px"
            borderColor="gray.300"
            borderLeft="none"
            borderLeftRadius={0}
            borderBottom={isOpen ? 'none' : 'auto'}
            borderBottomRightRadius={isOpen ? 'none' : 'auto'}
            color="blue.400"
            size="xs"
            variant="ghost"
            aria-label={hidden ? 'show facet' : 'hide facet'}
            m={0}
            height={8}
            px={2}
          >
            {hidden ? 'show' : 'hide'}
          </Button>
        </HStack>
      </h2>
      {isOpen && (
        <Box
          pl={10}
          py="1"
          pr="1"
          border={isOpen && 'solid 1px'}
          borderColor={isOpen && 'gray.400'}
          borderTop="none"
          borderBottomRadius="md"
          mt="0"
        >
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
        </Box>
      )}
    </ListItem>
  );
};

export interface ISearchFacetsProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
}

export const SearchFacets = (props: ISearchFacetsProps) => {
  const { onQueryUpdate } = props;
  const facets = useStore((state) => state.settings.searchFacets.order);
  const getHiddenFacets = useStore((state) => state.getHiddenSearchFacets);
  const setFacets = useStore((state) => state.setSearchFacetOrder);
  const resetFacets = useStore((state) => state.resetSearchFacets);
  const hideSearchFacet = useStore((state) => state.hideSearchFacet);
  const showSearchFacet = useStore((state) => state.showSearchFacet);
  const toggleOpenAllFilters = useStore((state) => state.toggleSearchFacetsOpen);
  const [showHiddenFacets, setShowHiddenFacets] = useState(false);

  const hiddenFacets = useMemo(() => getHiddenFacets(), [facets]);

  // hold temporary order of visible and hidden facets during drag and drop
  const [facetsList, setFacetsList] = useState({
    visible: [...facets],
    hidden: [...hiddenFacets],
  });

  const [draggingFacetId, setDraggingFacetId] = useState<SearchFacetID>();

  useEffect(() => {
    if (facets.length === 0) {
      toggleOpenAllFilters(false);
      resetFacets();
    }
    // reset
    setFacetsList({ hidden: [...hiddenFacets], visible: [...facets] });
  }, [facets, hiddenFacets]);

  const toggleShowHidden: MouseEventHandler = () => {
    setShowHiddenFacets(!showHiddenFacets);
  };

  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  });

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const { visible, hidden } = facetsList;

    // item moved into temp hidden area because hidden list is closed
    if (over.id === 'temp-hidden-container') {
      // show hidden list so it's clear where item is being dragged
      setShowHiddenFacets(true);
    }
    // item moved into hidden container when the list is empty
    else if (over.id === 'hidden-container') {
      if (hiddenFacets.length === 0) {
        // move item to hidden
        setFacetsList({
          visible: visible.filter((id) => id !== active.id),
          hidden: [active.id as SearchFacetID],
        });
      }
    } else if (active?.id !== over.id) {
      const activeContainer = visible.findIndex((id) => id === active.id) !== -1 ? visible : hidden;
      const overContainer = hidden.findIndex((id) => id === over.id) !== -1 ? hidden : visible;
      const activeIndex = activeContainer.indexOf(active.id as SearchFacetID);
      const overIndex = overContainer.indexOf(over.id as SearchFacetID);

      if (activeContainer === visible && overContainer === visible) {
        setFacetsList((prev) => ({
          ...prev,
          visible: arrayMove(prev.visible, activeIndex, overIndex),
        }));
      } else if (activeContainer === hidden && overContainer === hidden) {
        setFacetsList((prev) => ({
          ...prev,
          hidden: arrayMove(prev.hidden, activeIndex, overIndex),
        }));
      } else if (activeContainer === hidden && overContainer === visible) {
        // moved to visible
        setFacetsList((prev) => ({
          visible: [...prev.visible.slice(0, overIndex), active.id as SearchFacetID, ...prev.visible.slice(overIndex)],
          hidden: prev.hidden.filter((id) => id !== active.id),
        }));
      } else if (activeContainer === visible && overContainer === hidden) {
        // moved to hidden
        setFacetsList((prev) => ({
          visible: prev.visible.filter((id) => id !== active.id),
          hidden: [...prev.hidden.slice(0, overIndex), active.id as SearchFacetID, ...prev.hidden.slice(overIndex)],
        }));
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingFacetId(event.active.id as SearchFacetID);
  };

  // Make the changes permanent
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const { visible } = facetsList;

    if (visible.length < facets.length) {
      // item moved to hidden
      hideSearchFacet(active.id as SearchFacetID);
    } else if (visible.length > facets.length) {
      // item moved to visible
      showSearchFacet(
        active.id as SearchFacetID,
        visible.findIndex((id) => id === active.id),
      );
    } else {
      // item order moved
      setFacets([...visible]);
    }
  };

  const visibleItems = useMemo(() => {
    return facetsList.visible.map((facetId) => {
      const facetProps = facetConfig[facetId];
      return <SearchFacet {...facetProps} key={facetProps.storeId} onQueryUpdate={onQueryUpdate} hidden={false} />;
    });
  }, [facetsList.visible, onQueryUpdate]);

  const hiddenItems = useMemo(() => {
    const facetProps = facetsList.hidden.map((id) => facetConfig[id]).sort((a, b) => a.label.localeCompare(b.label));
    return facetProps.map((facetProp) => {
      return <SearchFacet {...facetProp} key={facetProp.storeId} onQueryUpdate={onQueryUpdate} hidden={true} />;
    });
  }, [facetsList.hidden, onQueryUpdate]);

  const activeItem = useMemo(() => {
    if (draggingFacetId) {
      const facetProp = facetConfig[draggingFacetId];
      // change hidden
      return <SearchFacet {...facetProp} key={facetProp.storeId} onQueryUpdate={onQueryUpdate} hidden={true} />;
    }
  }, [draggingFacetId]);

  return (
    <>
      <DndContext
        sensors={[mouseSensor]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <DroppableContainer id="visible-container" itemsID={facetsList.visible} items={visibleItems} />

        <Button
          variant="link"
          onClick={toggleShowHidden}
          type="button"
          rightIcon={<Toggler isToggled={showHiddenFacets} />}
          w="fit-content"
          fontSize="sm"
          my={2}
        >
          {showHiddenFacets ? 'Hide hidden filters' : 'Show hidden filters'} {`(${hiddenItems.length})`}
        </Button>

        {/* create a droppable area when hidden facets are not open */}
        {!showHiddenFacets && <DroppableContainer id="temp-hidden-container" />}

        {showHiddenFacets && (
          <DroppableContainer id="hidden-container" itemsID={facetsList.hidden} items={hiddenItems} />
        )}
        {activeItem && (
          <DragOverlay>
            <List>{activeItem}</List>
          </DragOverlay>
        )}
      </DndContext>
    </>
  );
};

const DroppableContainer = ({
  id,
  itemsID,
  items,
}: {
  id: string;
  itemsID?: SearchFacetID[];
  items?: JSX.Element[];
}) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <>
      {items && itemsID ? (
        <SortableContext id={id} items={itemsID} strategy={verticalListSortingStrategy}>
          <List spacing={1} ref={setNodeRef} minH="10">
            {items}
          </List>
        </SortableContext>
      ) : (
        // empty area
        <Box id={id} ref={setNodeRef} minH="40" />
      )}
    </>
  );
};
