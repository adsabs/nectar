import { Box, Stack, useToken } from '@chakra-ui/react';
import { BarGraph, IBarGraph } from '@components/Visualizations';
import { BarDatum } from '@nivo/bar';
import { ReactElement, useMemo, useState } from 'react';
import { GetHandleProps, GetTrackProps, Handles, Rail, Slider, SliderItem, Tracks } from 'react-compound-slider';

export type HistogramData = { x: number; y: number }[];

export interface IHistogramSliderProps {
  data: HistogramData;
  barGraphH?: string;
}
interface IncludeExcludeBarDatum extends BarDatum {
  x: number;
  include: number;
  exclude: number;
}

export const HistogramSlider = ({ data, barGraphH = '500px' }: IHistogramSliderProps): ReactElement => {
  const range = [data[0].x, data[data.length - 1].x];
  const [values, setValues] = useState(range);

  const graph: IBarGraph<IncludeExcludeBarDatum> = useMemo(() => {
    const graphData = data.map(({ x, y }) => {
      return x < values[0] || x > values[1] ? { x, include: 0, exclude: y } : { x, exclude: 0, include: y };
    });
    return { data: graphData, indexBy: 'x', keys: ['include', 'exclude'] };
  }, [data, values]);

  const [excludeColor, includeColor, excludeTrackColor] = useToken('colors', ['gray.50', 'blue.400', 'gray.100']);

  const color = ({ id }) => (id === 'include' ? includeColor : excludeColor);

  return (
    <Box>
      <BarGraph
        data={graph.data}
        indexBy={graph.indexBy}
        keys={graph.keys}
        showGroupOptions={false}
        margin={{ top: 0, left: 0, right: 0, bottom: 10 }}
        height={barGraphH}
        animate={false}
        axisLeft={null}
        axisBottom={null}
        padding={0.05}
        colors={color}
        isInteractive={false}
        enableGridY={false}
      />
      <Slider
        mode={2}
        step={1}
        domain={range}
        values={values}
        rootStyle={{
          position: 'relative',
          width: '100%',
        }}
        // onUpdate={setValues}
        onChange={setValues}
      >
        <Rail>
          {({ getRailProps }) => (
            <Box
              as="div"
              position="absolute"
              width="full"
              height="1"
              mb="35"
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
      ml={-8}
      mt={-2.5}
      zIndex="2"
      w={16}
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
