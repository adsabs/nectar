import { ChevronRightIcon, IconProps } from '@chakra-ui/icons';
import { Box, BoxProps, Button, Center, forwardRef } from '@chakra-ui/react';
import { ReactElement } from 'react';

type Dir = 'left' | 'right' | 'up' | 'down';

export interface ITogglerProps extends BoxProps {
  isToggled?: boolean;
  onDirection?: Dir;
  offDirection?: Dir;
  renderIcon?: (props: IconProps) => ReactElement;
  offLabel?: string;
  onLabel?: string;
  isButton?: boolean;
}

const dirs = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

export const Toggler = forwardRef<ITogglerProps, 'div'>((props, ref) => {
  const {
    isToggled = false,
    onDirection = 'down',
    offDirection = 'right',
    isButton = false,
    renderIcon = (props) => <ChevronRightIcon {...props} />,
    onLabel = 'Toggle Off',
    offLabel = 'Toggle On',
    ...boxProps
  } = props;

  const transform = isToggled
    ? getTransform(dirs[offDirection], dirs[onDirection])
    : getTransform(dirs[onDirection], dirs[offDirection]);

  return (
    <Box
      as={isButton ? Button : 'div'}
      aria-label={isToggled ? onLabel : offLabel}
      variant="unstyled"
      ref={ref}
      {...boxProps}
    >
      <Center>
        {renderIcon({
          transform,
          transition: 'transform .3s linear',
        })}
      </Center>
    </Box>
  );
});

const getTransform = (from = 0, to = 90) => `rotate(${from}deg) rotate(${to - from}deg)`;
