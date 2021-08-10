import { IDocsEntity } from '@api';
import { ISearchMachine } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import React, { HTMLAttributes } from 'react';
import { Item } from './Item/Item';
import { Pagination } from './Pagination';
import { ListActions } from './ListActions';
import { Skeleton } from './Skeleton';

export interface IResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  hideCheckboxes?: boolean;
  isLoading?: boolean;
  service?: ISearchMachine;
  showActions: boolean;
}

export const ResultList = (props: IResultListProps): React.ReactElement => {
  const { docs = [], isLoading = false, hideCheckboxes = false, service: searchService, showActions, ...divProps } = props;

  const handleSortChange = () => {}

  const handleSelectAll = () => {};

  const handleSelectNone = () => {};

  const handleLimitedTo = () => {};

  const handleExclude = () => {};

  const indexStart = useSelector(searchService, (state) => {
    const { page, numPerPage } = state.context.pagination;
    return (page - 1) * numPerPage + 1;
  });

  return (
    <article {...divProps} className="flex flex-col mt-1 space-y-1">
      {isLoading || !showActions ? null : (
        <ListActions
          selectedCount={0}
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
            <Item doc={doc} key={doc.id} index={indexStart + index} hideCheckbox={hideCheckboxes} />
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
