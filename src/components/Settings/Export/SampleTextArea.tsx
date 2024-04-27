import { FormControl, FormControlProps, FormLabel, Textarea } from '@chakra-ui/react';
import { useColorModeColors } from '@/lib';

export type ISampleTextAreaProps = {
  value: string;
  label: string;
} & Partial<FormControlProps>;

export const SampleTextArea = ({ value, label, ...formControlProps }: ISampleTextAreaProps) => {
  const { panel } = useColorModeColors();
  return (
    <FormControl {...formControlProps}>
      <FormLabel>{label}</FormLabel>
      <Textarea
        value={value}
        isReadOnly
        h="lg"
        borderRadius="md"
        backgroundColor={panel}
        fontFamily="monospace"
        fontWeight="semibold"
      />
    </FormControl>
  );
};
