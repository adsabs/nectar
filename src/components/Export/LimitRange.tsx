import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/slider';
import PT from 'prop-types';
import { ReactElement, useCallback } from 'react';
import { MAX_RECORDS } from './constants';
import { ExportState } from './types';

interface ILimitRangeProps {
  limit: ExportState['limit'];
  max: number;
  onLimitChange: (limit: ExportState['limit']) => void;
}
const propTypes = {
  limit: PT.number.isRequired,
  onLimitChange: PT.func.isRequired,
};

const defaultProps = {
  limit: MAX_RECORDS,
  max: MAX_RECORDS,
};

export const LimitRange = ({ limit, max, onLimitChange }: ILimitRangeProps): ReactElement => {
  const handleLimitChange = useCallback((limit) => onLimitChange(limit), []);

  if (max <= 1) {
    return null;
  }

  return (
    <FormControl>
      <FormLabel>
        Limit to {limit} {limit > 1 ? 'records' : 'record'}
      </FormLabel>
      <Slider data-testid="limit-range" values={limit} min={1} max={max} onChange={handleLimitChange}>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb index={1} />
      </Slider>
    </FormControl>
  );
};

LimitRange.propTypes = propTypes;
LimitRange.defaultProps = defaultProps;
