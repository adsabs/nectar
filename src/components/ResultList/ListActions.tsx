import { SolrSort } from '@api';
import { Sort } from '@components';
import { SimpleSortDropdown } from '@components/Sort/SimpleSortDropdown';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { isBrowser } from '@utils';
import { useSelector } from '@xstate/react';
import clsx from 'clsx';
import { ReactElement, useCallback, useState } from 'react';

interface IListActionProp {
  service?: ISearchMachine;
  selectedCount: number;
  totalCount: number;
  query: string;
  sort: SolrSort[];
  page: number;
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
    query,
    sort: [sort, ...otherSorts],
    page,
    onSelectAll,
    onSelectNone,
    onLimitedTo,
    onExclude,
  } = props;

  const [showHighlight, setShowHighlight] = useState<boolean>(false);

  const toggleShowHighlight = () => setShowHighlight(!showHighlight);
  const handleSelectAll = () => onSelectAll();
  const handleSelectNone = () => onSelectNone();
  const handleLimitedTo = () => onLimitedTo();
  const handleExclude = () => onExclude();

  const hlClass = clsx(showHighlight ? 'default-button' : 'default-button-inactive', '-ml-0');
  const linkBtnDisabled = clsx('link-button-disabled ml-4 h-5');
  const linkBtn = clsx('link-button ml-4 h-5');

  return (
    <>
      {!isBrowser() ? (
        <span>
          <SimpleSortDropdown query={query} selected={sort} page={page} />
        </span>
      ) : (
        <>
          <div className="sm:flex">
            <div>
              <button type="button" className={hlClass} onClick={toggleShowHighlight}>
                Show Highlights
              </button>
            </div>
            <SortWrapper service={searchService} />
          </div>
          <div className="flex flex-col items-start bg-gray-100 rounded-md lg:flex-row lg:items-center lg:justify-between">
            <div className="order-2 lg:order-1">
              <button
                type="button"
                className={selectedCount < totalCount ? linkBtn : linkBtnDisabled}
                onClick={handleSelectAll}
              >
                Select All
              </button>
              <button
                type="button"
                className={selectedCount > 0 ? linkBtn : linkBtnDisabled}
                onClick={handleSelectNone}
              >
                Select None
              </button>
              <button type="button" className={selectedCount > 0 ? linkBtn : linkBtnDisabled} onClick={handleLimitedTo}>
                Limited To
              </button>
              <button type="button" className={selectedCount > 0 ? linkBtn : linkBtnDisabled} onClick={handleExclude}>
                Exclude
              </button>
              <span className="m-2 h-5 text-sm">{selectedCount} Selected</span>
            </div>
            <div className="order-1 lg:order-2">
              <button type="button" className="default-button ml-2">
                Add to Library
              </button>
              <button type="button" className="default-button">
                Export
              </button>
              <button type="button" className="default-button mr-2">
                Explore
              </button>
            </div>
          </div>
        </>
      )}
    </>
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

  return <Sort sort={sort} onChange={handleSortChange} leftMargin="md:ml-1" />;
};
