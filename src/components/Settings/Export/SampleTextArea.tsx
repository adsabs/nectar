import { FormControl, FormControlProps, FormLabel, Textarea } from '@chakra-ui/react';
import { memo } from 'react';

export type ISampleTextAreaProps = {
  value: string;
  label: string;
} & Partial<FormControlProps>;

export const SampleTextArea = memo(
  ({ value, label, ...formControlProps }: ISampleTextAreaProps) => {
    return (
      <FormControl {...formControlProps}>
        <FormLabel>{label}</FormLabel>
        <Textarea
          value={value}
          isReadOnly
          h="lg"
          borderRadius="md"
          backgroundColor="gray.50"
          fontFamily="monospace"
          fontWeight="semibold"
        />
      </FormControl>
    );
  },
  (prev, next) => prev.value === next.value,
);
