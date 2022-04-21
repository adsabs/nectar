import { SolrSort } from '@api';
import { Sort } from '@components';
import { Sender } from '@xstate/react/lib/types';
import { CitationExporterEvent } from '../CitationExporter.machine';

export const SortSelector = (props: { sort: SolrSort[]; dispatch: Sender<CitationExporterEvent> }) => {
  const { dispatch, sort = ['date desc'] } = props;
  const handleSortChange = (newSort: SolrSort[]) => {
    dispatch({ type: 'SET_SORT', payload: newSort });
  };

  return <Sort hideLabel={false} sort={sort} onChange={handleSortChange} fullWidth />;
};
