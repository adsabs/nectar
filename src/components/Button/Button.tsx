import clsx from 'clsx';
import React, { FC, HTMLAttributes, ReactChild } from 'react';

export interface IButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactChild;
}

export const Button: FC<IButtonProps> = (props) => {
  const styles = clsx(
    props.className,
    'inline-flex items-center justify-center mt-3 px-4 py-2 w-full text-white font-medium bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md focus:outline-none shadow-sm focus:ring-indigo-500 focus:ring-offset-2 focus:ring-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm',
  );
  return <button {...props} className={styles}></button>;
};
