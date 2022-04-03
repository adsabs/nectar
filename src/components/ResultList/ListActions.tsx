import { Button, Checkbox, Stack } from '@chakra-ui/react';
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
    <Stack direction="column" spacing={1} mb={1}>
      <Stack direction={{ base: 'column', sm: 'row' }} spacing={1} width="min-content">
        <HighlightsToggle />
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
                <Button variant="link" fontWeight="normal" onClick={clearSelected}>
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
  const isClient = useIsClient();
  const toggleShowHighlights = () => setShowHights(!showHighlights);

  return (
    <>
      {isClient ? (
        <Button
          variant={showHighlights ? 'solid' : 'outline'}
          onClick={toggleShowHighlights}
          size="md"
          borderRadius="2px"
        >
          Show Highlights
        </Button>
      ) : null}
    </>
  );
};

const SelectAllCheckbox = () => {
  const selectAll = useStore((state) => state.selectAll);
  const isAllSelected = useStore((state) => state.docs.isAllSelected);
  const isSomeSelected = useStore((state) => state.docs.isSomeSelected);
  const clearAllSelected = useStore((state) => state.clearAllSelected);

  const handleClick = () => {
    if (isAllSelected || isSomeSelected) {
      clearAllSelected();
    } else {
      selectAll();
    }
  };
  return (
    <Checkbox
      size="md"
      isChecked={isAllSelected}
      isIndeterminate={!isAllSelected && isSomeSelected}
      onChange={handleClick}
    />
  );
};
