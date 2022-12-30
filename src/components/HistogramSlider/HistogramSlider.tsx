import { Box, Flex, Stack } from '@chakra-ui/react';
import { Histogram, HistogramDatum } from '@components/Visualizations';
import { ReactElement, useEffect, useState } from 'react';
import { GetHandleProps, GetTrackProps, Handles, Rail, Slider, SliderItem, Tracks } from 'react-compound-slider';

const trackHeight = 0.5;

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
  const range = [data[0].x, data[data.length - 1].x]; // histogram domain
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
      <Slider
        mode={2}
        step={1}
        domain={range}
        values={values}
        rootStyle={{
          position: 'relative',
          width: sliderWidth,
        }}
        onUpdate={handleUpdateValues}
        onChange={handleChangeValues}
      >
        <Rail>
          {({ getRailProps }) => (
            <Box
              as="div"
              position="absolute"
              width={sliderWidth}
              height={trackHeight}
              borderRadius="5"
              bgColor="gray.100"
              {...getRailProps}
            />
          )}
        </Rail>

        <Handles>
          {/* Handle label alignment based on left or right handle */}
          {({ handles, getHandleProps }) => (
            <Box as="div" className="slider-handles">
              {handles[0].percent < handles[1].percent ? (
                <>
                  <Handle key={handles[0].id} handle={handles[0]} getHandleProps={getHandleProps} align="end" />
                  <Handle key={handles[1].id} handle={handles[1]} getHandleProps={getHandleProps} align="start" />
                </>
              ) : handles[0].percent > handles[1].percent ? (
                <>
                  <Handle key={handles[0].id} handle={handles[0]} getHandleProps={getHandleProps} align="start" />
                  <Handle key={handles[1].id} handle={handles[1]} getHandleProps={getHandleProps} align="end" />
                </>
              ) : (
                <>
                  <Handle key={handles[0].id} handle={handles[0]} getHandleProps={getHandleProps} align="center" />
                  <Handle key={handles[1].id} handle={handles[1]} getHandleProps={getHandleProps} align="center" />
                </>
              )}
            </Box>
          )}
        </Handles>
        <Tracks right={false} left={false}>
          {({ tracks, getTrackProps }) => (
            <Box as="div" className="slider-tracks">
              {tracks.map(({ id, source, target }) => (
                <Track key={id} source={source} target={target} getTrackProps={getTrackProps} />
              ))}
            </Box>
          )}
        </Tracks>
      </Slider>
    </Flex>
  );
};

interface IHandleProps {
  handle: SliderItem;
  getHandleProps: GetHandleProps;
  align: 'start' | 'end' | 'center';
}

const Handle = ({ handle, getHandleProps, align }: IHandleProps): ReactElement => {
  return (
    <Stack
      direction="column"
      position="absolute"
      ml={-4}
      mt={-2}
      zIndex="2"
      w="2em"
      style={{
        left:
          align === 'center'
            ? `${handle.percent}%`
            : align === 'start'
            ? `calc(${handle.percent}% + 0.5em)`
            : `calc(${handle.percent}% - 0.5em)`,
      }}
      alignItems={align}
    >
      <Box
        width={4}
        height={4}
        cursor="pointer"
        borderRadius="xl"
        bgColor="white"
        color="gray.900"
        borderColor="blue.600"
        borderWidth={1}
        {...getHandleProps(handle.id)}
      />
      <Box mt={5} fontSize="md">
        {handle.value}
      </Box>
    </Stack>
  );
};

const Track = ({
  source,
  target,
  getTrackProps,
}: {
  source: SliderItem;
  target: SliderItem;
  getTrackProps: GetTrackProps;
}): ReactElement => {
  return (
    <Box
      h={1}
      position="absolute"
      height={trackHeight}
      zIndex="1"
      bgColor="blue.600"
      borderRadius="lg"
      cursor="pointer"
      style={{
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {...getTrackProps()}
    />
  );
};
