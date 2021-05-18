import clsx from 'clsx';
import React, { HTMLAttributes, ReactChild } from 'react';

export interface ITextInputProps extends HTMLAttributes<HTMLInputElement> {
  children?: ReactChild;
}

export const TextInput = React.forwardRef<HTMLInputElement, ITextInputProps>(
  (props, ref): React.ReactElement => {
    const styles = clsx(
      props.className,
      'block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm',
    );
    return <input ref={ref} {...props} type="text" className={styles} />;
  },
);
