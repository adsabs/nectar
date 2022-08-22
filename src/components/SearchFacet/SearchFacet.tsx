import { FacetField, IADSApiSearchParams, IFacetCountsFields } from '@api';
import { ChevronDownIcon, ChevronRightIcon, DragHandleIcon } from '@chakra-ui/icons';
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
import { DndContext, DragEndEvent, MouseSensor, useSensor } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExclamationCircleIcon } from '@heroicons/react/solid';
import { useStoreApi } from '@store';
import { findIndex, pluck, propEq } from 'ramda';
import { CSSProperties, ReactElement, useEffect, useState } from 'react';
import { facetConfig } from './config';
import { applyFiltersToQuery } from './helpers';
import { OnFilterArgs, SearchFacetTree } from './SearchFacetTree';
import { FacetLogic } from './types';

export interface ISearchFacetProps extends AccordionItemProps {
  field: FacetField;
  property?: keyof IFacetCountsFields;
  hasChildren?: boolean;
  facetQuery?: string;
  label: string;
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
  const { label, field, property, hasChildren, logic, facetQuery, defaultIsOpen, filter, onQueryUpdate } = props;
  const { listeners, attributes, setNodeRef, setActivatorNodeRef, transform, transition, isSorting } = useSortable({
    id: field,
    strategy: verticalListSortingStrategy,
  });
  const { isOpen, onToggle, onClose } = useDisclosure({
    defaultIsOpen,
    id: field,
    onOpen: () => {
      setHasError(false);
    },
  });
  const [hasError, setHasError] = useState(false);

  const handleOnFilter = (filterArgs: OnFilterArgs) => {
    const query = store.getState().latestQuery;
    onQueryUpdate(applyFiltersToQuery({ ...filterArgs, query }));
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
    <ListItem ref={setNodeRef} style={style}>
      <h2>
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
          mb="0"
          px="0.5"
        >
          <DragHandleIcon mr="1" />
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

const getField = pluck('field');
const findItem = (id: FacetField) => findIndex(propEq('field', id));

export interface ISearchFacetsProps {
  onQueryUpdate: ISearchFacetProps['onQueryUpdate'];
}

export const SearchFacets = (props: ISearchFacetsProps) => {
  const { onQueryUpdate } = props;
  const [facets, setFacets] = useState(facetConfig);

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
      setFacets((items) => {
        const oldIndex = findItem(active?.id as FacetField)(items);
        const newIndex = findItem(over?.id as FacetField)(items);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      <DndContext
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        sensors={[mouseSensor]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={getField(facets)} strategy={verticalListSortingStrategy}>
          <List>
            {facets.map((facetProps) => (
              <SearchFacet {...facetProps} key={facetProps.field} onQueryUpdate={onQueryUpdate} />
            ))}
          </List>
        </SortableContext>
      </DndContext>
    </>
  );
};
