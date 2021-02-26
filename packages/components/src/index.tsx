import React, { FC, HTMLAttributes } from 'react';

export interface Props extends HTMLAttributes<HTMLDivElement> {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

// Please do not use types off of a default export module or else Storybook Docs will suffer.
// see: https://github.com/storybookjs/storybook/issues/9556
/**
 * A custom Thing component. Neat!
 */
export const Counter: FC<Props> = ({ count = 0, onIncrement, onDecrement }) => {
  return (
    <div className="flex-col p-4">
      <p>count: {count}</p>
      <p>
        <button
          className="focus:outline-none text-white text-sm py-2.5 px-5 rounded-md bg-blue-500 hover:bg-blue-600 hover:shadow-lg"
          onClick={onIncrement}
        >
          +
        </button>
        <button
          className="mx-4 focus:outline-none text-white text-sm py-2.5 px-5 rounded-md bg-blue-500 hover:bg-blue-600 hover:shadow-lg"
          onClick={onDecrement}
        >
          -
        </button>
      </p>
    </div>
  );
};
