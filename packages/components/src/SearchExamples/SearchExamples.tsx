import React, { FC } from 'react';
import { examples } from './examples';

export interface ISearchExamplesProps {
  onClick(text: string): void;
}

export const SearchExamples: FC<ISearchExamplesProps> = ({ onClick }) => {
  const createHandler = (text: string) => {
    if (typeof onClick === 'function') {
      return onClick.bind(null, text);
    }
    return undefined;
  };

  return (
    <div className="flex w-3/4 mx-auto justify-evenly flex-col md:flex-row">
      <ul className="flex-col md:px-3 md:w-1/3">
        {examples.left.map(({ label, text }) => (
          <li className="flex justify-between py-1" key={label}>
            <div className="flex items-center flex-1">{label}</div>
            <button
              type="button"
              className="border border-dotted p-1 font-bold hover:bg-gray-200"
              onClick={createHandler(text)}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
      <ul className="flex-col md:px-3 md:w-5/12">
        {examples.right.map(({ label, text }) => (
          <li className="flex justify-evenly py-1" key={label}>
            <div className="flex items-center flex-1">{label}</div>
            <button
              type="button"
              className="border border-dotted p-1 font-bold hover:bg-gray-200"
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
