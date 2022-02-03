import { SolrSort } from '@api';
import { Button } from '@chakra-ui/button';
import { Box, Stack } from '@chakra-ui/layout';
import { Sort } from '@components';
import { SimpleSortDropdown } from '@components/Sort/SimpleSortDropdown';
import { useIsClient } from '@hooks/useIsClient';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import { ReactElement, useCallback, useState } from 'react';

interface IListActionProp {
  service?: ISearchMachine;
  selectedCount: number;
  totalCount: number;
  onSortChange: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onLimitedTo: () => void;
  onExclude: () => void;
}

export const ListActions = (props: IListActionProp): ReactElement => {
  const {
    service: searchService,
    selectedCount,
    totalCount,
    onSelectAll,
    onSelectNone,
    onLimitedTo,
    onExclude,
  } = props;

  const [showHighlight, setShowHighlight] = useState<boolean>(false);
  const isClient = useIsClient();

  const page = useSelector(searchService, (state) => {
    return state.context.pagination.page;
  });

  const query = useSelector(searchService, (state) => {
    return state.context.params.q;
  });

  const sort = useSelector(searchService, (state) => {
    const params = state.context.params;
    return params.sort;
  });

  const toggleShowHighlight = () => setShowHighlight(!showHighlight);
  const handleSelectAll = () => onSelectAll();
  const handleSelectNone = () => onSelectNone();
  const handleLimitedTo = () => onLimitedTo();
  const handleExclude = () => onExclude();

  return (
    <Box>
      {!isClient ? (
        <SimpleSortDropdown query={query} selected={sort[0]} page={page} />
      ) : (
        <Stack direction="column" spacing={1}>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={1} width="min-content">
            <Button
              variant={showHighlight ? 'solid' : 'outline'}
              onClick={toggleShowHighlight}
              size="md"
              borderRadius="2px"
            >
              Show Highlights
            </Button>
            <SortWrapper service={searchService} />
          </Stack>
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
              <Button
                variant="link"
                fontWeight="normal"
                disabled={!(selectedCount < totalCount)}
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button variant="link" fontWeight="normal" disabled={selectedCount === 0} onClick={handleSelectNone}>
                Select None
              </Button>
              <Button variant="link" fontWeight="normal" disabled={selectedCount === 0} onClick={handleLimitedTo}>
                Limited To
              </Button>
              <Button variant="link" fontWeight="normal" disabled={selectedCount === 0} onClick={handleExclude}>
                Exclude
              </Button>
              <span className="m-2 h-5 text-sm">{selectedCount} Selected</span>
            </Stack>
            <Stack direction="row" mx={5} order={{ base: '1', md: '2' }} wrap="wrap">
              <Button>Add to Library</Button>
              <Button>Export</Button>
              <Button>Explore</Button>
            </Stack>
          </Stack>
        </Stack>
      )}
    </Box>
  );
};

/**
 * Wraps the <Sort/> component in order to isolate renders
 */
const SortWrapper = ({ service: searchService }: { service: ISearchMachine }) => {
  const handleSortChange = useCallback((newSort: SolrSort[]) => {
    searchService.send({ type: TransitionType.SET_PARAMS, payload: { params: { sort: newSort } } });
  }, []);

  const sort = useSelector(searchService, (state) => state.context.params.sort);

  return <Sort sort={sort} onChange={handleSortChange} />;
};
