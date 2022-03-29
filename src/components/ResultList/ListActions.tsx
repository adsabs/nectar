import { Button, Checkbox, Stack, VisuallyHidden } from '@chakra-ui/react';
import { ISortProps, Sort } from '@components/Sort';
import { useIsClient } from '@hooks/useIsClient';
import { AppState, useStore } from '@store';
import { noop } from '@utils';
import { ReactElement, useState } from 'react';

export interface IListActionsProps {
  onSortChange?: ISortProps['onChange'];
}

export const ListActions = (props: IListActionsProps): ReactElement => {
  const { onSortChange = noop } = props;
  const selected = useStore((state) => state.docs.selected.length);
  const clearSelected = useStore((state) => state.clearSelected);
  const isClient = useIsClient();
  const noneSelected = selected === 0;

  return (
    <Stack
      direction="column"
      spacing={1}
      mb={1}
      as="section"
      aria-labelledby="result-actions-title"
      data-testid="listactions"
    >
      <VisuallyHidden as="h2" id="result-actions-title">
        Result Actions
      </VisuallyHidden>
      <Stack direction={{ base: 'column', sm: 'row' }} spacing={1} width="min-content">
        {isClient && <HighlightsToggle />}
        <SortWrapper onChange={onSortChange} />
      </Stack>
      {isClient && (
        <Stack
          direction={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'start', md: 'center' }}
          justifyContent={{ md: 'space-between' }}
          backgroundColor="gray.50"
          borderRadius="2px"
          p={2}
        >
          <Stack
            direction="row"
            spacing={{ base: '2', md: '5' }}
            order={{ base: '2', md: '1' }}
            mt={{ base: '2', md: '0' }}
            wrap="wrap"
          >
            <SelectAllCheckbox />
            {!noneSelected && (
              <>
                <span className="m-2 h-5 text-sm">{selected.toLocaleString()} Selected</span>
                <Button variant="link" fontWeight="normal" onClick={clearSelected} data-testid="listactions-clearall">
                  Clear All
                </Button>
                <Button variant="link" fontWeight="normal">
                  Limited To
                </Button>
                <Button variant="link" fontWeight="normal">
                  Exclude
                </Button>
              </>
            )}
          </Stack>
          <Stack direction="row" mx={5} order={{ base: '1', md: '2' }} wrap="wrap">
            <Button>Add to Library</Button>
            <Button>Export</Button>
            <Button>Explore</Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

const sortSelector: [
  (state: AppState) => AppState['query'],
  (prev: AppState['query'], next: AppState['query']) => boolean,
] = [(state) => state.query, (prev, curr) => prev.sort === curr.sort];
const SortWrapper = ({ onChange }: { onChange: ISortProps['onChange'] }) => {
  const query = useStore(...sortSelector);

  return <Sort sort={query.sort} onChange={onChange} />;
};

const HighlightsToggle = () => {
  const [showHighlights, setShowHights] = useState(false);
  const toggleShowHighlights = () => setShowHights(!showHighlights);

  return (
    <Button
      variant={showHighlights ? 'solid' : 'outline'}
      onClick={toggleShowHighlights}
      size="md"
      borderRadius="2px"
      data-testid="listactions-showhighlights"
    >
      Show Highlights
    </Button>
  );
};

const selectors = {
  selectAll: (state: AppState) => state.selectAll,
  isAllSelected: (state: AppState) => state.docs.isAllSelected,
  isSomeSelected: (state: AppState) => state.docs.isSomeSelected,
  clearAllSelected: (state: AppState) => state.clearAllSelected,
};
const useDocSelection = () => {
  const selectAll = useStore(selectors.selectAll);
  const isAllSelected = useStore(selectors.isAllSelected);
  const isSomeSelected = useStore(selectors.isSomeSelected);
  const clearAllSelected = useStore(selectors.clearAllSelected);
  return {
    selectAll,
    isAllSelected,
    isSomeSelected,
    clearAllSelected,
  };
};

const SelectAllCheckbox = () => {
  const { selectAll, isAllSelected, isSomeSelected, clearAllSelected } = useDocSelection();

  const handleChange = () => {
    isAllSelected || isSomeSelected ? clearAllSelected() : selectAll();
  };

  return (
    <Checkbox
      size="md"
      isChecked={isAllSelected}
      isIndeterminate={!isAllSelected && isSomeSelected}
      onChange={handleChange}
      data-testid="listactions-checkbox"
    />
  );
};
