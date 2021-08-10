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
      <div className="flex">
        <button className={hlClass} onClick={toggleShowHighlight}>Show Highlights</button>
        <button className={absClass} onClick={toggleShowAbstract}>Show Abstracts</button>
        <Sort onChange={onSortChange} />
      </div>
      <div className="flex bg-gray-100 justify-between items-center rounded-md">
        <div>
          <button className="link-button ml-4" onClick={onSelectAll}>Select All</button>
          <button className="link-button" onClick={onSelectNone}>Select None</button>
          <button className="link-button" onClick={onLimitedTo}>Limited To</button>
          <button className="link-button" onClick={onExclude}>Exclude</button>
          <span className="text-sm m-2">{selectedCount} Selected</span>
        </div>
        <div>
          <button className="default-button">Add to Library</button>
          <button className="default-button">Export</button>
          <button className="default-button mr-2">Explore</button>
        </div>
      </div>
    </div>
  );
}