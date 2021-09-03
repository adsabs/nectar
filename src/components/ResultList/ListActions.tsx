import { SolrSort } from '@api';
import { Sort } from '@components';
import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';

interface IListActionProp {
  service?: ISearchMachine;
  selectedCount: number;
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
    onSortChange,
    onSelectAll,
    onSelectNone,
    onLimitedTo,
    onExclude,
  } = props;

  const [showHighlight, setShowHighlight] = useState<boolean>(false);

  const [showAbstract, setShowAbstract] = useState<boolean>(false);

  const toggleShowHighlight = () => {
    setShowHighlight(!showHighlight);
  };

  const toggleShowAbstract = () => {
    setShowAbstract(!showAbstract);
  };

  const handleSelectAll = () => {
    onSelectAll();
  };

  const handleSelectNone = () => {
    onSelectNone();
  };

  const handleLimitedTo = () => {
    onLimitedTo();
  };

  const handleExclude = () => {
    onExclude();
  };

  const hlClass = clsx(showHighlight ? 'default-button' : 'default-button-inactive', '-ml-0');

  const absClass = clsx(showAbstract ? 'default-button' : 'default-button-inactive');

  return (
    <div>
      <div className="md:flex">
        <div>
          <button className={hlClass} onClick={toggleShowHighlight}>
            Show Highlights
          </button>
          <button className={absClass} onClick={toggleShowAbstract}>
            Show Abstracts
          </button>
        </div>
        {/* <Sort onChange={onSortChange} leftMargin="md:ml-1" /> */}
        <SortWrapper service={searchService} />
      </div>
      <div className="flex flex-col items-start bg-gray-100 rounded-md lg:flex-row lg:items-center lg:justify-between">
        <div className="order-2 lg:order-1">
          <button className="link-button ml-4 h-5" onClick={handleSelectAll}>
            Select All
          </button>
          <button className="link-button h-5" onClick={handleSelectNone}>
            Select None
          </button>
          <button className="link-button h-5" onClick={handleLimitedTo}>
            Limited To
          </button>
          <button className="link-button h-5" onClick={handleExclude}>
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
    </div>
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
