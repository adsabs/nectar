import { useStore } from '@store/store';
import clsx from 'clsx';
import { FC, HTMLAttributes } from 'react';
import { examples } from './examples';

export interface ISearchExamplesProps {
  onClick?(text: string): void;
  className?: HTMLAttributes<HTMLDivElement>['className'];
}

export const SearchExamples: FC<ISearchExamplesProps> = ({ onClick, className }) => {
  const theme = useStore((state) => state.theme);

  const rootClasses = clsx(className, 'grid gap-3 grid-cols-6');

  const createHandler = (text: string) => {
    if (typeof onClick === 'function') {
      return () => onClick(text);
    }
    return undefined;
  };

  return (
    <div className={rootClasses}>
      <h3 className="col-span-6 mb-3 text-center text-lg font-bold">Search Examples</h3>
      <ul className="col-span-6 p-1 md:col-span-3">
        {examples[theme].left.map(({ label, text }) => (
          <li className="grid gap-5 grid-cols-3 py-1" key={label}>
            <div className="col-span-1 text-right font-bold">{label}</div>
            <button
              type="button"
              className="col-span-2 p-1 hover:bg-gray-200 border border-dotted"
              onClick={createHandler(text)}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
      <ul className="col-span-6 p-1 md:col-span-3">
        {examples[theme].right.map(({ label, text }) => (
          <li className="grid gap-5 grid-cols-3 py-1" key={label}>
            <div className="col-span-1 text-right font-bold">{label}</div>
            <button
              type="button"
              className="col-span-2 p-1 hover:bg-gray-200 border border-dotted"
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
