import { Sort } from '@components';
import clsx from 'clsx';
import React, { useState } from 'react';

interface IListActionProp {
  selectedCount: number;
  onSortChange: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onLimitedTo: () => void;
  onExclude: () => void;
}

export const ListActions = (props: IListActionProp): React.ReactElement => {

  const {selectedCount, onSortChange, onSelectAll, onSelectNone, onLimitedTo, onExclude} = props;

  const [showHighlight, setShowHighlight] = useState<boolean>(false);

  const [showAbstract, setShowAbstract] = useState<boolean>(false);

  const toggleShowHighlight = () => {
    setShowHighlight(!showHighlight);
  }

  const toggleShowAbstract = () => {
    setShowAbstract(!showAbstract);
  }

  const hlClass = clsx(showHighlight? "default-button" : "default-button-inactive", "-ml-0");

  const absClass = clsx(showAbstract? "default-button" : "default-button-inactive");
  
  return (
    <div>
      <div className="md:flex">
        <div>
          <button className={hlClass} onClick={toggleShowHighlight}>Show Highlights</button>
          <button className={absClass} onClick={toggleShowAbstract}>Show Abstracts</button>
        </div>
        <Sort onChange={onSortChange} leftMargin="md:ml-1" />
      </div>
      <div className="flex flex-col items-start lg:flex-row bg-gray-100 lg:justify-between lg:items-center rounded-md">
        <div className="order-2 lg:order-1">
          <button className="link-button h-5 ml-4" onClick={onSelectAll}>Select All</button>
          <button className="link-button h-5" onClick={onSelectNone}>Select None</button>
          <button className="link-button h-5" onClick={onLimitedTo}>Limited To</button>
          <button className="link-button h-5" onClick={onExclude}>Exclude</button>
          <span className="text-sm m-2 h-5">{selectedCount} Selected</span>
        </div>
        <div className="order-1 lg:order-2">
          <button className="default-button ml-2">Add to Library</button>
          <button className="default-button">Export</button>
          <button className="default-button mr-2">Explore</button>
        </div>
      </div>
    </div>
  );
}