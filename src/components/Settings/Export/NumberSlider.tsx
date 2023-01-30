import { FormControl, FormLabel } from '@chakra-ui/react';
import { Slider } from '@components';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

export const NumberSlider = (props: {
  min: number;
  max: number;
  value: number;
  onChange?: (value: number) => void;
  label?: string;
}) => {
  const { value, onChange, label, min, max } = props;
  const [userValue, setUserValue] = useState(value);
  const [debouncedValue] = useDebounce(userValue, 300);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue]);

  const handleChange = (val: number[]) => setUserValue(val[0]);

  return (
    <FormControl>
      <FormLabel fontSize={['sm', 'md']}>
        {label} <span aria-hidden="true">({value})</span>
      </FormLabel>
      <Slider
        id="maxauthor-slider"
        aria-label={label}
        range={[min, max]}
        values={[value]}
        onSlideEnd={handleChange}
        size={1}
        px={4}
      />
    </FormControl>
  );
};
