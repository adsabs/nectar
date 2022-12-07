import { Box, Stack } from '@chakra-ui/react';
import { Histogram } from '@components/Visualizations';
import { ReactElement, useEffect, useState } from 'react';
import { GetHandleProps, GetTrackProps, Handles, Rail, Slider, SliderItem, Tracks } from 'react-compound-slider';

export type HistogramData = { x: number; y: number }[];

export interface IHistogramSliderProps {
  data: HistogramData;
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

  useEffect(() => {
    setValues(selectedRange);
  }, [selectedRange]);

  const handleChangeValues = (values: [number, number]) => {
    setValues(values);
    onValuesChanged(values);
  };

  return (
    <Box w={width}>
      <Histogram
        data={data}
        highlightDomain={values}
        showXAxis={false}
        showYAxis={false}
        w={width}
        h={height}
        margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <Slider
        mode={2}
        step={1}
        domain={range}
        values={values}
        rootStyle={{
          position: 'relative',
          width: width,
        }}
        onUpdate={setValues}
        onChange={handleChangeValues}
      >
        <Rail>
          {({ getRailProps }) => (
            <Box
              as="div"
              position="absolute"
              width={width}
              height="1"
              mt={-1}
              borderRadius="5"
              bgColor="gray.100"
              {...getRailProps}
            />
          )}
        </Rail>

        <Handles>
          {({ handles, getHandleProps }) => (
            <Box as="div" className="slider-handles">
              {handles.map((handle) => (
                <Handle key={handle.id} handle={handle} getHandleProps={getHandleProps} />
              ))}
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
    </Box>
  );
};

interface IHandleProps {
  handle: SliderItem;
  getHandleProps: GetHandleProps;
}

const Handle = ({ handle, getHandleProps }: IHandleProps): ReactElement => {
  return (
    <Stack
      direction="column"
      position="absolute"
      ml={-4}
      mt={-2.5}
      zIndex="2"
      w={8}
      style={{
        left: `${handle.percent}%`,
      }}
      alignItems="center"
    >
      <Box
        width={4}
        height={4}
        cursor="pointer"
        borderRadius="xl"
        bgColor="blue.600"
        color="gray.900"
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
      height={1}
      zIndex="1"
      mt={-1}
      bgColor="blue.600"
      borderRadius="lg"
      cursor="pointer"
      style={{
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {
        ...getTrackProps() /* this will set up events if you want it to be clickeable (optional) */
      }
    />
  );
};
