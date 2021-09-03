import { IDocsEntity } from '@api';
import { ISearchMachine } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import React, { HTMLAttributes } from 'react';
import { Item } from './Item/Item';
import { Pagination } from './Pagination';
import { ListActions } from './ListActions';
import { Skeleton } from './Skeleton';
import { useEffect } from 'react';
import { useState } from 'react';
export interface IResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  hideCheckboxes?: boolean;
  isLoading?: boolean;
  service?: ISearchMachine;
  showActions: boolean;
}

interface ISelection {
  selectAll: boolean;
  selectNone: boolean;
  selectedCount: number;
}

export const ResultList = (props: IResultListProps): React.ReactElement => {
  const [selection, setSelection] = useState<ISelection>({
    selectAll: false,
    selectNone: false,
    selectedCount: 0,
  });

  const {
    docs = [],
    isLoading = false,
    hideCheckboxes = false,
    service: searchService,
    showActions,
    ...divProps
  } = props;

  const numPerPage = useSelector(searchService, (state) => {
    return state.context.pagination.numPerPage;
  });

  const handleSortChange = () => {};

  const handleSelectAll = () => {
    setSelection({
      selectAll: true,
      selectNone: false,
      selectedCount: numPerPage,
    });
  };

  const handleSelectNone = () => {
    setSelection({
      selectAll: false,
      selectNone: true,
      selectedCount: 0,
    });
  };

  const handleLimitedTo = () => {};

  const handleExclude = () => {};

  const handleItemSet = (check) => {
    setSelection({
      selectAll: false,
      selectNone: false,
      selectedCount: check ? selection.selectedCount + 1 : selection.selectedCount - 1,
    });
  };

  const indexStart = useSelector(searchService, (state) => {
    const { page, numPerPage } = state.context.pagination;
    return (page - 1) * numPerPage + 1;
  });

  useEffect(() => {
    setSelection({
      selectAll: false,
      selectNone: false,
      selectedCount: 0,
    });
  }, [indexStart]);

  return (
    <article {...divProps} className="flex flex-col mt-1 space-y-1">
      {isLoading || !showActions ? null : (
        <ListActions
          service={searchService}
          selectedCount={selection.selectedCount}
          onSortChange={handleSortChange}
          onSelectAll={handleSelectAll}
          onSelectNone={handleSelectNone}
          onLimitedTo={handleLimitedTo}
          onExclude={handleExclude}
        />
      )}
      {isLoading ? (
        <Skeleton count={10} />
      ) : docs.length > 0 ? (
        <>
          {docs.map((doc, index) => (
            <Item
              doc={doc}
              key={doc.id}
              index={indexStart + index}
              hideCheckbox={hideCheckboxes}
              set={selection.selectAll}
              clear={selection.selectNone}
              onSet={handleItemSet}
            />
          ))}
          {/* footer */}
          <Pagination service={searchService} />
        </>
      ) : (
        <div className="flex items-center justify-center text-lg">No Results Found</div>
      )}
    </article>
  );
};
