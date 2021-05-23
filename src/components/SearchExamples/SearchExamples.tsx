import clsx from 'clsx';
import React, { FC, HTMLAttributes } from 'react';
import { examples } from './examples';

export interface ISearchExamplesProps {
  onClick?(text: string): void;
  className?: HTMLAttributes<HTMLDivElement>['className'];
}

export const SearchExamples: FC<ISearchExamplesProps> = ({
  onClick,
  className,
}) => {
  const rootClasses = clsx(className, 'grid gap-3 grid-cols-6');

  const createHandler = (text: string) => {
    if (typeof onClick === 'function') {
      return () => onClick(text);
    }
    return undefined;
  };

  return (
    <div className={rootClasses}>
      <h3 className="col-span-6 mb-3 text-center text-lg font-bold">
        Search Examples
      </h3>
      <ul className="col-span-6 p-1 md:col-span-3">
        {examples.left.map(({ label, text }) => (
          <li className="flex justify-between py-1" key={label}>
            <div className="flex flex-1 items-center">{label}</div>
            <button
              type="button"
              className="p-1 font-bold hover:bg-gray-200 border border-dotted"
              onClick={createHandler(text)}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
      <ul className="col-span-6 p-1 md:col-span-3">
        {examples.right.map(({ label, text }) => (
          <li className="flex justify-evenly py-1" key={label}>
            <div className="flex flex-1 items-center">{label}</div>
            <button
              type="button"
              className="p-1 font-bold hover:bg-gray-200 border border-dotted"
              onClick={createHandler(text)}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
