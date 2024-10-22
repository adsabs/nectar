import { useColorModeColors } from '@/lib/useColorModeColors';
import { Box, Stack, StyleProps } from '@chakra-ui/react';

import { ReactElement } from 'react';
import {
  GetHandleProps,
  GetTrackProps,
  Handles,
  Rail,
  Slider as CompoundSlider,
  SliderItem,
  Ticks,
  Tracks,
} from 'react-compound-slider';

export interface ISliderProps extends StyleProps {
  id?: string;
  range: [number, number];
  values: number[];
  onUpdate?: (values: number[]) => void;
  onSlideEnd: (values: number[]) => void;
  width?: number;
  size?: 0.5 | 1;
  step?: number;
  ticks?: [label: string, value: number][];
}

export const Slider = ({
  id,
  range,
  values,
  onUpdate,
  onSlideEnd,
  width,
  size = 0.5,
  step = 1,
  ticks,
  ...boxProps
}: ISliderProps) => {
  // slider moved
  const handleUpdateValues = (values: readonly number[]) => {
    if (onUpdate) {
      onUpdate([...values]);
    }
  };

  // slider stopped
  const handleChangeValues = (values: readonly number[]) => {
    onSlideEnd([...values]);
  };

  const isSingleValue = values.length === 1;

  const marginTop = size === 0.5 ? -2 : -1.5;

  const showLabel = !ticks;

  // keyboard apply enter, set new value
  const handleEnter = (index: number, value: number) => {
    onSlideEnd([...values.slice(0, index), value, ...values.slice(index + 1)]);
  };

  return (
    <Box id={id} width={width || 'full'} minH={34} {...boxProps}>
      <CompoundSlider
        mode={2}
        step={step}
        domain={range}
        values={values}
        rootStyle={{
          position: 'relative',
        }}
        onSlideEnd={handleChangeValues} // value when mouse drag stopped
        onUpdate={handleUpdateValues} // this updates values when mouse or keyboard dragging, used by histogram
      >
        <Rail>
          {({ getRailProps }) => (
            <Box
              as="div"
              position="absolute"
              width={width || 'full'}
              height={size}
              borderRadius="5"
              bgColor="gray.100"
              {...getRailProps}
            />
          )}
        </Rail>

        <Handles>
          {({ handles, getHandleProps }) =>
            handles.length === 1 ? (
              <Handle
                key={handles[0].id}
                handle={handles[0]}
                getHandleProps={getHandleProps}
                align="center"
                mt={marginTop}
                showLabel={showLabel}
                onEnter={(value) => handleEnter(0, value)}
              />
            ) : (
              <Box as="div" className="slider-handles">
                {handles[0].percent < handles[1].percent ? (
                  <>
                    <Handle
                      key={handles[0].id}
                      handle={handles[0]}
                      getHandleProps={getHandleProps}
                      align="end"
                      mt={marginTop}
                      showLabel={showLabel}
                      onEnter={(value) => handleEnter(0, value)}
                    />
                    <Handle
                      key={handles[1].id}
                      handle={handles[1]}
                      getHandleProps={getHandleProps}
                      align="start"
                      mt={marginTop}
                      showLabel={showLabel}
                      onEnter={(value) => handleEnter(1, value)}
                    />
                  </>
                ) : handles[0].percent > handles[1].percent ? (
                  <>
                    <Handle
                      key={handles[0].id}
                      handle={handles[0]}
                      getHandleProps={getHandleProps}
                      align="start"
                      mt={marginTop}
                      showLabel={showLabel}
                      onEnter={(value) => handleEnter(0, value)}
                    />
                    <Handle
                      key={handles[1].id}
                      handle={handles[1]}
                      getHandleProps={getHandleProps}
                      align="end"
                      mt={marginTop}
                      showLabel={showLabel}
                      onEnter={(value) => handleEnter(1, value)}
                    />
                  </>
                ) : (
                  <>
                    <Handle
                      key={handles[0].id}
                      handle={handles[0]}
                      getHandleProps={getHandleProps}
                      align="center"
                      mt={marginTop}
                      showLabel={showLabel}
                      onEnter={(value) => handleEnter(0, value)}
                    />
                    <Handle
                      key={handles[1].id}
                      handle={handles[1]}
                      getHandleProps={getHandleProps}
                      align="center"
                      mt={marginTop}
                      showLabel={showLabel}
                      onEnter={(value) => handleEnter(1, value)}
                    />
                  </>
                )}
              </Box>
            )
          }
        </Handles>
        <Tracks right={false} left={isSingleValue}>
          {({ tracks, getTrackProps }) => (
            <Box as="div" className="slider-tracks">
              {tracks.map(({ id, source, target }) => (
                <Track key={id} source={source} target={target} height={size} getTrackProps={getTrackProps} />
              ))}
            </Box>
          )}
        </Tracks>
        {ticks && (
          <Ticks values={ticks.map((t) => t[1])}>
            {({ ticks: tks }) => (
              <div className="slider-ticks">
                {tks.map((tick, index) => (
                  <Tick key={tick.id} tick={tick} count={tks.length} label={ticks[index][0]} />
                ))}
              </div>
            )}
          </Ticks>
        )}
      </CompoundSlider>
    </Box>
  );
};

interface IHandleProps {
  handle: SliderItem;
  getHandleProps: GetHandleProps;
  align: 'start' | 'end' | 'center';
  mt: number;
  showLabel: boolean;
  onEnter: (value: number) => void;
}

const Handle = ({ handle, getHandleProps, align, mt, showLabel, onEnter }: IHandleProps): ReactElement => {
  return (
    <Stack
      direction="column"
      position="absolute"
      ml={-4}
      mt={mt}
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
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onEnter(handle.value);
        }
      }}
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
        tabIndex={0}
        {...getHandleProps(handle.id)}
      />
      {showLabel && (
        <Box mt={5} fontSize="md">
          {handle.value}
        </Box>
      )}
    </Stack>
  );
};

const Track = ({
  source,
  target,
  height,
  getTrackProps,
}: {
  source: SliderItem;
  target: SliderItem;
  height: number;
  getTrackProps: GetTrackProps;
}): ReactElement => {
  const { brand } = useColorModeColors();
  return (
    <Box
      h={1}
      position="absolute"
      height={height}
      zIndex="1"
      bgColor={brand}
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

interface ITickProps {
  tick: SliderItem;
  count: number;
  label: string;
}

const Tick = ({ tick, count, label }: ITickProps) => {
  return (
    <Box width="full">
      <Box position="absolute" top={3} w={0.5} h={2} left={`calc(${tick.percent}% - 1.5px)`} bgColor="gray.500" />
      <Box
        position="absolute"
        width={`${100 / count}%`}
        top={5}
        left={`${tick.percent}%`}
        textAlign="center"
        style={{
          marginLeft: `${-(100 / count) / 2}%`,
        }}
      >
        {label}
      </Box>
    </Box>
  );
};
