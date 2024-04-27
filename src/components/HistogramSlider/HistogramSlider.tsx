import { Flex } from '@chakra-ui/react';
import { Slider } from '@/components/Slider';
import { Histogram, HistogramDatum } from '@/components/Visualizations';
import { ReactElement, useEffect, useState } from 'react';

export interface IHistogramSliderProps {
  data: HistogramDatum[];
  selectedRange?: [number, number];
  onValuesChanged: (values: number[]) => void;
  width: number;
  height: number;
}

export const HistogramSlider = ({
  data,
  selectedRange = [data[0].x, data[data.length - 1].x],
  onValuesChanged,
  width,
  height,
}: IHistogramSliderProps): ReactElement => {
  const range: [number, number] = [data[0].x, data[data.length - 1].x]; // histogram domain
  const [values, setValues] = useState(selectedRange); // left and right slider values
  const [sliderWidth, setSliderWidth] = useState(width);

  useEffect(() => {
    setValues(selectedRange);
  }, [selectedRange]);

  // slider moving
  const handleUpdateValues = (values: readonly number[]) => {
    setValues([values[0], values[1]]);
  };

  // slider stopped
  const handleChangeValues = (values: readonly number[]) => {
    setValues([values[0], values[1]]);
    onValuesChanged([values[0], values[1]]);
  };

  const handleClickHistogram = (x: number) => {
    setValues([x, x]);
    onValuesChanged([x, x]);
  };

  const handleBarWidthChanged = (barWidth: number) => {
    // slider width is slightly smaller than histogram
    // so that each handle lands in the middle point of the histogram bar
    setSliderWidth(width - barWidth);
  };

  return (
    <Flex w={width} direction="column" alignItems="center">
      <Histogram
        data={data}
        highlightDomain={values}
        showXAxis={false}
        showYAxis={false}
        w={width}
        h={height}
        margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        onClick={handleClickHistogram}
        onBarWidthReady={handleBarWidthChanged}
      />
      {range[0] === range[1] ? (
        <>{range[0]}</>
      ) : (
        <Slider
          aria-label="histogram slider"
          range={range}
          values={values}
          onUpdate={handleUpdateValues}
          onSlideEnd={handleChangeValues}
          width={sliderWidth}
          size={0.5}
        />
      )}
    </Flex>
  );
};
