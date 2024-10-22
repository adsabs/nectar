import { FormControl, FormHelperText, FormLabel, Input } from '@chakra-ui/react';
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactElement } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface ITextInputProps
  extends Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'ref'> {
  label?: string;
  helptext?: string;
}

export const TextInput = forwardRef<HTMLInputElement, ITextInputProps>((props, ref): ReactElement => {
  const { label, helptext, size, ...inputProps } = props;

  if (typeof label === 'string') {
    const id = typeof inputProps.id === 'string' ? inputProps.id : `input-text-${uuidv4()}`;
    return (
      <FormControl>
        <FormLabel>{label}</FormLabel>
        <Input as="input" ref={ref} id={id} {...inputProps} />
        {helptext && <FormHelperText>{helptext}</FormHelperText>}
      </FormControl>
    );
  }

  return <Input as="input" ref={ref} {...inputProps} />;
});
TextInput.displayName = 'TextInput';
