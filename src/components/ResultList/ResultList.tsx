import { IDocsEntity } from '@api';
import { useADSApi } from '@hooks';
import { ISearchMachine } from '@machines/lib/search/types';
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
  const adsApi = useADSApi();

  return (
    <div {...divProps} className="flex flex-col mt-1 space-y-1">
      {isLoading ? (
        <Skeleton count={10} />
      ) : docs.length > 0 ? (
        docs.map((doc, index) => <Item doc={doc} key={doc.id} index={index + 1} hideCheckbox={hideCheckboxes} />)
      ) : (
        <div className="flex items-center justify-center text-lg">No Results Found</div>
      )}

      {/* footer */}
      <Pagination service={searchService} />
    </div>
  );
};
