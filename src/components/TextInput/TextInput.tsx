import clsx from 'clsx';
import React, { HTMLAttributes } from 'react';
import { v4 as uuidv4 } from 'uuid';
export interface ITextInputProps extends HTMLAttributes<HTMLInputElement> {
  name?: string;
  label?: string;
  inputClasses?: string;
  labelClasses?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, ITextInputProps>(
  (props, ref): React.ReactElement => {
    const { label, inputClasses, labelClasses, ...inputProps } = props;
    const labelStyles =
      typeof labelClasses === 'string'
        ? labelClasses
        : 'block text-gray-700 text-sm font-medium';
    const inputStyles = clsx(
      typeof inputClasses === 'string'
        ? inputClasses
        : 'block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm',
      props.className,
    );

    if (typeof label === 'string') {
      const id =
        typeof inputProps.id === 'string'
          ? inputProps.id
          : `input-text-${uuidv4()}`;
      return (
        <>
          <label htmlFor={id} className={labelStyles}>
            {label}
          </label>
          <div className="mt-1">
            <input
              ref={ref}
              id={id}
              {...props}
              type="text"
              className={inputStyles}
            />
          </div>
        </>
      );
    }

    return (
      <input ref={ref} {...inputProps} type="text" className={inputStyles} />
    );
  },
);
