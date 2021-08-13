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
        <div className="flex px-2 py-1 bg-white border rounded-md" key={i.toString()}>
          <div className="w-full space-y-1 animate-pulse">
            <div className="w-1/4 h-4 bg-gray-300 rounded"> </div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="w-5/6 h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
};
