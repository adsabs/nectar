import { IDocsEntity } from '@api';
import { ISearchMachine } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import React, { HTMLAttributes } from 'react';
import { Item } from './Item/Item';
import { Pagination } from './Pagination';
import { Skeleton } from './Skeleton';

export interface IResultListProps extends HTMLAttributes<HTMLDivElement> {
  docs: IDocsEntity[];
  hideCheckboxes?: boolean;
  isLoading?: boolean;
  service?: ISearchMachine;
}

export const ResultList = (props: IResultListProps): React.ReactElement => {
  const { docs = [], isLoading = false, hideCheckboxes = false, service: searchService, ...divProps } = props;

  const indexStart = useSelector(searchService, (state) => {
    const { page, numPerPage } = state.context.pagination;
    return (page - 1) * numPerPage + 1;
  });

  return (
    <article {...divProps} className="flex flex-col mt-1 space-y-1">
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
