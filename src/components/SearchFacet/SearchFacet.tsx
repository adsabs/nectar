import { FacetField, IFacetCountsFields } from '@api';
import { ChevronDownIcon, ChevronRightIcon, DragHandleIcon } from '@chakra-ui/icons';
import { AccordionItemProps, Box, Button, List, ListItem, useDisclosure } from '@chakra-ui/react';
import { DndContext, DragEndEvent, MouseSensor, useSensor } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { findIndex, pluck, propEq } from 'ramda';
import { CSSProperties, ReactElement, useEffect, useState } from 'react';
import { facetConfig } from './config';
import { SearchFacetTree } from './SearchFacetTree';
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
}
export const SearchFacet = (props: ISearchFacetProps): ReactElement => {
  const { label, field, property, hasChildren, logic, facetQuery, defaultIsOpen, filter } = props;
  const { listeners, attributes, setNodeRef, setActivatorNodeRef, transform, transition, isSorting } = useSortable({
    id: field,
    strategy: verticalListSortingStrategy,
  });
  const { isOpen, onToggle, onClose } = useDisclosure({ defaultIsOpen, id: field });

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
          <Box flex="1" textAlign="left">
            {label}
          </Box>

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
          />
        )}
      </Box>
    </ListItem>
  );
};

const getField = pluck('field');
const findItem = (id: FacetField) => findIndex(propEq('field', id));
export const SearchFacets = () => {
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
    <DndContext
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      sensors={[mouseSensor]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={getField(facets)} strategy={verticalListSortingStrategy}>
        <List>
          {facets.map((facetProps) => (
            <SearchFacet {...facetProps} key={facetProps.field} />
          ))}
        </List>
      </SortableContext>
    </DndContext>
  );
};
