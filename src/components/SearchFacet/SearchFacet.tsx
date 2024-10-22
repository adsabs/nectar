import { DragHandleIcon } from '@chakra-ui/icons';
import {
  AccordionItemProps,
  Box,
  Button,
  Center,
  HStack,
  Icon,
  IconButton,
  List,
  ListItem,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { FacetList } from '@/components/SearchFacet/FacetList';
import { FacetStoreProvider, selectors, useFacetStore } from '@/components/SearchFacet/store/FacetStore';
import { Toggler } from '@/components/Toggler';
import {
  closestCenter,
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
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { AppState, useStore, useStoreApi } from '@/store';
import { append, uniq, without } from 'ramda';
import {
  CSSProperties,
  KeyboardEvent,
  MouseEventHandler,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { facetConfig } from './config';
import { applyFiltersToQuery } from './helpers';
import { FacetLogic, OnFilterArgs, SearchFacetID } from './types';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { sendGTMEvent } from '@next/third-parties/google';
import { FacetField, IADSApiSearchParams, IFacetCountsFields } from '@/api/search/types';

export interface ISearchFacetProps extends AccordionItemProps {
  field: FacetField;
  property?: keyof IFacetCountsFields;
  hasChildren?: boolean;
  facetQuery?: string;
  label: string;
  storeId: SearchFacetID;
  maxDepth?: number;
  /** Disallow loading more, regardless of result */
  noLoadMore?: boolean;
  forceUppercaseInitial?: boolean;
  logic: {
    single: FacetLogic[];
    multiple: FacetLogic[];
  };
  defaultIsHidden?: boolean;
  onVisibilityChange?: (change: { id: SearchFacetID; hidden: boolean }) => void;
  filter?: string[];
  onQueryUpdate: (queryUpdates: Partial<IADSApiSearchParams>) => void;
}

export const SearchFacet = (props: ISearchFacetProps): ReactElement => {
  const store = useStoreApi();
  const setFacetState = useStore((state) => state.setSearchFacetState);
  const hideFacet = useStore((state) => state.hideSearchFacet);
  const showFacet = useStore((state) => state.showSearchFacet);
  const { label, field, storeId, onQueryUpdate, noLoadMore, defaultIsHidden, onVisibilityChange } = props;
  const { listeners, attributes, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: storeId,
    strategy: verticalListSortingStrategy,
  });

  // to make sure state stays in sync
  useEffect(() => {
    if (defaultIsHidden) {
      hideFacet(storeId);
    } else {
      showFacet(storeId);
    }
  }, [defaultIsHidden, hideFacet, showFacet, storeId]);

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
    sendGTMEvent({
      event: 'facet_applied',
      facet_field: filterArgs.field,
      facet_logic: filterArgs.logic,
    });
  };

  const handleHideClick = useCallback(() => {
    if (typeof onVisibilityChange === 'function') {
      onVisibilityChange({
        id: storeId,
        hidden: !facetState.hidden,
      });
    }
    facetState.hidden ? showFacet(storeId) : hideFacet(storeId);
  }, [facetState.hidden, hideFacet, onVisibilityChange, showFacet, storeId]);

  const handleOnError = () => {
    setHasError(true);
    onClose();
  };

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    border: isDragging ? 'dashed blue 3px' : undefined,
    padding: isDragging ? '4px' : undefined,
  };

  const setKeyboardFocused = useFacetStore(selectors.setKeyboardFocused);

  const handleFacetKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (isOpen && e.key === 'ArrowDown') {
      // enter focus on first item
      setKeyboardFocused([0]);
    }
  };

  return (
    <ListItem ref={setNodeRef} style={style} my={0} w="64">
      <h3>
        <HStack
          spacing={0}
          sx={{
            '&:has(button:focus)': {
              border: '3px solid rgba(66, 153, 225, 0.6)',
            },
          }}
        >
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
            _focus={{
              boxShadow: '',
            }}
            onKeyDown={handleFacetKeyDown}
          >
            <DragHandleIcon mr="1" color="gray.400" fontSize="md" />
            <Toggler isToggled={isOpen} fontSize="2xl" />
            <HStack flex="1" textAlign="left" mx="1">
              <Text flex="1" fontSize="md" fontWeight="medium">
                {label}
              </Text>
              {hasError && (
                <Tooltip label="Error loading facet, try again later">
                  <Icon as={ExclamationCircleIcon} color="red.500" />
                </Tooltip>
              )}
            </HStack>
          </Button>
          <Tooltip
            label={facetState.hidden ? `Show ${label.toLowerCase()} filter` : `Hide ${label.toLowerCase()} filter`}
          >
            <IconButton
              onClick={handleHideClick}
              border="solid 1px"
              borderColor="gray.300"
              borderLeft="none"
              borderLeftRadius={0}
              borderBottom={isOpen ? 'none' : 'auto'}
              borderBottomRightRadius={isOpen ? 'none' : 'auto'}
              color="gray.200"
              size="sm"
              fontSize="sm"
              variant="ghost"
              aria-label={facetState.hidden ? `Show ${label} filter` : `Hide ${label} filter`}
              m={0}
              height={8}
              icon={<Center>{facetState.hidden ? <Icon as={EyeSlashIcon} /> : <Icon as={EyeIcon} />}</Center>}
              onKeyDown={handleFacetKeyDown}
            />
          </Tooltip>
        </HStack>
      </h3>
      {isOpen && (
        <Box
          pl={7}
          py="1"
          pr="1"
          border={isOpen && 'solid 1px'}
          borderColor={isOpen && 'gray.400'}
          borderTop="none"
          borderBottomRadius="md"
          mt="0"
        >
          <FacetList noLoadMore={noLoadMore} onFilter={handleOnFilter} onError={handleOnError} />
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
  const ignoredFacets = useStore((state) => state.settings.searchFacets.ignored);

  const [showHiddenFacets, setShowHiddenFacets] = useState(false);
  const [draggingFacetId, setDraggingFacetId] = useState<SearchFacetID>();
  const hiddenFacets = useMemo(() => getHiddenFacets(), [facets]);

  // hold temporary order of visible and hidden facets during drag and drop
  const [facetsList, setFacetsList] = useState(() => ({
    visible: without(ignoredFacets, facets),
    hidden: uniq([...hiddenFacets, ...ignoredFacets]),
  }));

  // watch for changes in ignored facets
  useEffect(() => {
    setFacetsList({
      visible: without(ignoredFacets, facets),
      hidden: uniq([...getHiddenFacets(), ...ignoredFacets]),
    });
    // unable to add facets to deps because it disallows ignored facets from being un-hidden
  }, [ignoredFacets, getHiddenFacets]);

  useEffect(() => {
    // if all facets are hidden, reset the order
    if (facetsList.visible.length === 0) {
      toggleOpenAllFilters(false);
      resetFacets();
    }

    // if all facets are visible, close the hidden list
    if (facetsList.hidden.length === 0) {
      setShowHiddenFacets(false);
    }
  }, [facetsList, resetFacets, toggleOpenAllFilters, setShowHiddenFacets]);

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
      // show hidden list, so it's clear where item is being dragged
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

  // update state when facet is hidden or shown individually (not by drag and drop)
  const handleVisibilityChange: ISearchFacetProps['onVisibilityChange'] = ({ id, hidden }) => {
    setFacetsList((prev) => ({
      visible: uniq(hidden ? without([id], prev.visible) : append(id, prev.visible)),
      hidden: uniq(hidden ? append(id, prev.hidden) : without([id], prev.hidden)),
    }));
  };

  const visibleItems = useMemo(() => {
    return facetsList.visible.map((facetId) => {
      const facetProps = facetConfig[facetId];
      return (
        <FacetStoreProvider facetId={facetProps.storeId} key={facetProps.storeId}>
          <SearchFacet
            {...facetProps}
            onQueryUpdate={onQueryUpdate}
            defaultIsHidden={false}
            onVisibilityChange={handleVisibilityChange}
          />
        </FacetStoreProvider>
      );
    });
  }, [facetsList.visible, onQueryUpdate, handleVisibilityChange]);

  const hiddenItems = useMemo(() => {
    const facetProps = facetsList.hidden.map((id) => facetConfig[id]).sort((a, b) => a.label.localeCompare(b.label));
    return facetProps.map((facetProp) => {
      return (
        <FacetStoreProvider facetId={facetProp.storeId} key={facetProp.storeId}>
          <SearchFacet
            {...facetProp}
            onQueryUpdate={onQueryUpdate}
            defaultIsHidden={true}
            onVisibilityChange={handleVisibilityChange}
          />
        </FacetStoreProvider>
      );
    });
  }, [facetsList.hidden, onQueryUpdate, handleVisibilityChange]);

  const activeItem = useMemo(() => {
    if (draggingFacetId) {
      const facetProp = facetConfig[draggingFacetId];
      // change hidden
      return (
        <FacetStoreProvider facetId={facetProp.storeId} key={facetProp.storeId}>
          <SearchFacet
            {...facetProp}
            onQueryUpdate={onQueryUpdate}
            defaultIsHidden={true}
            onVisibilityChange={handleVisibilityChange}
          />
        </FacetStoreProvider>
      );
    }
  }, [draggingFacetId, onQueryUpdate, handleVisibilityChange]);

  return (
    <DndContext
      sensors={[mouseSensor]}
      modifiers={[restrictToVerticalAxis]}
      collisionDetection={closestCenter}
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

      {showHiddenFacets && <DroppableContainer id="hidden-container" itemsID={facetsList.hidden} items={hiddenItems} />}
      {activeItem && (
        <DragOverlay>
          <List>{activeItem}</List>
        </DragOverlay>
      )}
    </DndContext>
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
