import { range } from 'ramda';
import React from 'react';

interface ISkeletonProps {
  count: number;
}

export const Skeleton = (props: ISkeletonProps): React.ReactElement => {
  const { count } = props;

  return (
    <>
      {range(0, count).map((i) => (
        <div
          className="flex border py-1 px-2 rounded-md bg-white"
          key={i.toString()}
        >
          <div className="animate-pulse w-full space-y-1">
            <div className="h-4 bg-gray-300 rounded w-1/4"> </div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </>
  );
};
