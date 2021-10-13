import { SolrSort } from '@api';
import { Sort } from '@components';
import { ISimpleLinkDropdownItem, SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { sortValues } from '@components/Sort/model';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { isBrowser } from '@utils';
import { useSelector } from '@xstate/react';
import clsx from 'clsx';
import React, { MouseEvent, useCallback, useState } from 'react';

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

export const ListActions = (props: IListActionProp): React.ReactElement => {
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

  const toggleShowHighlight = (e: MouseEvent) => {
    e.preventDefault();
    setShowHighlight(!showHighlight);
  };

  const handleSelectAll = (e: MouseEvent) => {
    e.preventDefault();
    onSelectAll();
  };

  const handleSelectNone = (e: MouseEvent) => {
    e.preventDefault();
    onSelectNone();
  };

  const handleLimitedTo = (e: MouseEvent) => {
    e.preventDefault();
    onLimitedTo();
  };

  const handleExclude = (e: MouseEvent) => {
    e.preventDefault();
    onExclude();
  };

  const hlClass = clsx(showHighlight ? 'default-button' : 'default-button-inactive', '-ml-0');

  const linkBtnDisabled = clsx('link-button-disabled ml-4 h-5');

  const linkBtn = clsx('link-button ml-4 h-5');

  const sortItems = sortValues.reduce((result: ISimpleLinkDropdownItem[], s) => {
    result.push({
      id: `${s.id} desc`,
      domId: `sortBy-${s.id}`,
      path: `search?q=${query}&sort=${s.id} desc&p=${page}`,
      label: `${s.id} desc`,
    });

    result.push({
      id: `${s.id} asc`,
      domId: `sortBy-${s.id}`,
      path: `search?q=${query}&sort=${s.id} asc&p=${page}`,
      label: `${s.id} asc`,
    });

    return result;
  }, []);

  return (
    <>
      {!isBrowser() ? (
        <span>
          <SimpleLinkDropdown items={sortItems} selected={sort} label="Sort"></SimpleLinkDropdown>
        </span>
      ) : (
        <>
          <div className="sm:flex">
            <div>
              <button className={hlClass} onClick={toggleShowHighlight}>
                Show Highlights
              </button>
            </div>
            <SortWrapper service={searchService} />
          </div>
          <div className="flex flex-col items-start bg-gray-100 rounded-md lg:flex-row lg:items-center lg:justify-between">
            <div className="order-2 lg:order-1">
              <button className={selectedCount < totalCount ? linkBtn : linkBtnDisabled} onClick={handleSelectAll}>
                Select All
              </button>
              <button className={selectedCount > 0 ? linkBtn : linkBtnDisabled} onClick={handleSelectNone}>
                Select None
              </button>
              <button className={selectedCount > 0 ? linkBtn : linkBtnDisabled} onClick={handleLimitedTo}>
                Limited To
              </button>
              <button className={selectedCount > 0 ? linkBtn : linkBtnDisabled} onClick={handleExclude}>
                Exclude
              </button>
              <span className="m-2 h-5 text-sm">{selectedCount} Selected</span>
            </div>
            <div className="order-1 lg:order-2">
              <button className="default-button ml-2">Add to Library</button>
              <button className="default-button">Export</button>
              <button className="default-button mr-2">Explore</button>
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
