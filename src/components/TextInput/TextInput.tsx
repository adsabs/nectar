import clsx from 'clsx';
import React, { FC, HTMLAttributes, ReactChild } from 'react';

export interface ITextInputProps extends HTMLAttributes<HTMLInputElement> {
  children?: ReactChild;
}

export const TextInput: FC<ITextInputProps> = (
  props: ITextInputProps,
): React.ReactElement => {
  const styles = clsx(
    props.className,
    'block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm',
  );
  return <input {...props} type="text" className={styles} />;
};
