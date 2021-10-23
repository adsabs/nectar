import clsx from 'clsx';
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface ITextInputProps
  extends Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'ref'> {
  label?: string;
  helptext?: string;
  classes?: {
    input?: string;
    label?: string;
    helptext?: string;
  };
}

export const TextInput = forwardRef<HTMLInputElement, ITextInputProps>((props, ref): ReactElement => {
  const { label, classes, helptext, ...inputProps } = props;
  const labelStyles = typeof classes.label === 'string' ? classes.label : 'block text-sm font-medium text-gray-700';
  const inputStyles = clsx(
    typeof classes.input === 'string'
      ? classes.input
      : 'block w-full border-gray-300 focus:border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm',
    props.className,
  );
  const helptextStyles = clsx(typeof classes.helptext === 'string' ? classes.helptext : 'prose-sm prose text-gray-500');

  if (typeof label === 'string') {
    const id = typeof inputProps.id === 'string' ? inputProps.id : `input-text-${uuidv4()}`;
    return (
      <>
        <label htmlFor={id} className={labelStyles}>
          {label}
        </label>
        <div className="mt-1">
          <input ref={ref} id={id} {...inputProps} type="text" className={inputStyles} />
        </div>
        {helptext && <div className={helptextStyles}>{helptext}</div>}
      </>
    );
  }

  return <input ref={ref} {...inputProps} type="text" className={inputStyles} />;
});

TextInput.defaultProps = {
  classes: {},
};
