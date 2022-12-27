import { Stack, Box, StyleProps } from '@chakra-ui/react';
import { ReactElement } from 'react';
import {
  GetHandleProps,
  GetTrackProps,
  Handles,
  Rail,
  Slider as CompoundSlider,
  SliderItem,
  Tracks,
} from 'react-compound-slider';

export interface ISliderProps extends StyleProps {
  id?: string;
  range: [number, number];
  values: number[];
  onUpdate?: (values: number[]) => void;
  onChange: (values: number[]) => void;
  width?: number;
  size?: 0.5 | 1;
}

export const Slider = ({ id, range, values, onUpdate, onChange, width, size = 0.5, ...boxProps }: ISliderProps) => {
  // slider moved
  const handleUpdateValues = (values: readonly number[]) => {
    if (onUpdate) {
      onUpdate([...values]);
    }
  };

  // slider stopped
  const handleChangeValues = (values: readonly number[]) => {
    onChange([...values]);
  };

  const isSingleValue = values.length === 1;

  const marginTop = size === 0.5 ? -2 : -1.5;

  return (
    <Box id={id} width={width || 'full'} h={34} {...boxProps}>
      <CompoundSlider
        mode={2}
        step={1}
        domain={range}
        values={values}
        rootStyle={{
          position: 'relative',
        }}
        onUpdate={handleUpdateValues}
        onChange={handleChangeValues}
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
                    />
                    <Handle
                      key={handles[1].id}
                      handle={handles[1]}
                      getHandleProps={getHandleProps}
                      align="start"
                      mt={marginTop}
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
                    />
                    <Handle
                      key={handles[1].id}
                      handle={handles[1]}
                      getHandleProps={getHandleProps}
                      align="end"
                      mt={marginTop}
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
                    />
                    <Handle
                      key={handles[1].id}
                      handle={handles[1]}
                      getHandleProps={getHandleProps}
                      align="center"
                      mt={marginTop}
                    />
                  </>
                )}
              </Box>
            )
          }
        </Handles>
        <Tracks right={false} left={isSingleValue ? true : false}>
          {({ tracks, getTrackProps }) => (
            <Box as="div" className="slider-tracks">
              {tracks.map(({ id, source, target }) => (
                <Track key={id} source={source} target={target} height={size} getTrackProps={getTrackProps} />
              ))}
            </Box>
          )}
        </Tracks>
      </CompoundSlider>
    </Box>
  );
};

interface IHandleProps {
  handle: SliderItem;
  getHandleProps: GetHandleProps;
  align: 'start' | 'end' | 'center';
  mt: number;
}

const Handle = ({ handle, getHandleProps, align, mt }: IHandleProps): ReactElement => {
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
  height,
  getTrackProps,
}: {
  source: SliderItem;
  target: SliderItem;
  height: number;
  getTrackProps: GetTrackProps;
}): ReactElement => {
  return (
    <Box
      h={1}
      position="absolute"
      height={height}
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
