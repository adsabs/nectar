import { FormControl, FormLabel } from '@chakra-ui/form-control';
import clsx from 'clsx';
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@chakra-ui/input';

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
  const { label, classes, helptext, size, ...inputProps } = props;

  const helptextStyles = clsx(typeof classes.helptext === 'string' ? classes.helptext : 'prose-sm prose text-gray-500');

  if (typeof label === 'string') {
    const id = typeof inputProps.id === 'string' ? inputProps.id : `input-text-${uuidv4()}`;
    return (
      <FormControl>
        <FormLabel>{label}</FormLabel>
        <Input as="input" ref={ref} id={id} {...inputProps} />
        {helptext && <div className={helptextStyles}>{helptext}</div>}
      </FormControl>
    );
  }

  return <Input as="input" ref={ref} {...inputProps} />;
});

TextInput.defaultProps = {
  classes: {},
};
