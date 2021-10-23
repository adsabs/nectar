import PT from 'prop-types';
import { useCallback } from 'react';
import { getTrackBackground, Range } from 'react-range';
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
  const handleLimitChange = useCallback(([limit]) => onLimitChange(limit), []);

  if (max <= 1) {
    return null;
  }

  return (
    <div>
      <div className="block my-2 text-gray-700 text-sm font-medium">
        Limit to {limit} {limit > 1 ? 'records' : 'record'}
      </div>
      <Range
        data-testid="limit-range"
        values={[limit]}
        min={1}
        max={max}
        onChange={handleLimitChange}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              background: getTrackBackground({
                values: [limit],
                min: 1,
                max,
                colors: ['#548BF4', '#ccc'],
              }),
            }}
            className="mr-3 h-2 cursor-pointer"
          >
            {children}
          </div>
        )}
        renderThumb={({ props }) => <div {...props} className="w-3 h-3 bg-blue-500 rounded-md" />}
      />
    </div>
  );
};

LimitRange.propTypes = propTypes;
LimitRange.defaultProps = defaultProps;
