import { FormControl, FormLabel } from '@chakra-ui/react';
import { DescriptionCollapse, Slider } from '@components';
import { useState, useEffect, ReactElement } from 'react';
import { useDebounce } from 'use-debounce';

export const NumberSlider = (props: {
  min: number;
  max: number;
  value: number;
  onChange?: (value: number) => void;
  label?: string;
  description?: ReactElement;
}) => {
  const { value, onChange, label, min, max, description } = props;
  const [userValue, setUserValue] = useState(value);
  const [debouncedValue] = useDebounce(userValue, 300);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue]);

  const handleChange = (val: number[]) => setUserValue(val[0]);

  return (
    <>
      {description ? (
        <DescriptionCollapse body={description} label={label}>
          {({ btn, content }) => (
            <FormControl>
              <FormLabel fontSize={['sm', 'md']}>
                {label} <span aria-hidden="true">({value})</span> {btn}
              </FormLabel>
              {content}
              <Slider
                aria-label={label}
                range={[min, max]}
                values={[value]}
                onSlideEnd={handleChange}
                size={1}
                pt={4}
              />
            </FormControl>
          )}
        </DescriptionCollapse>
      ) : (
        <FormControl>
          <FormLabel fontSize={['sm', 'md']}>{label}</FormLabel>
          <Slider aria-label={label} range={[min, max]} values={[value]} onSlideEnd={handleChange} size={1} />
        </FormControl>
      )}
    </>
  );
};
