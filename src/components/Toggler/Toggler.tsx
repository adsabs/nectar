import { ChevronRightIcon } from '@chakra-ui/icons';
import { ComponentWithAs, forwardRef, Icon, IconProps } from '@chakra-ui/react';

type Dir = 'left' | 'right' | 'up' | 'down';

export interface ITogglerProps extends IconProps {
  isToggled?: boolean;
  onDirection?: Dir;
  offDirection?: Dir;
  icon?: ComponentWithAs<'svg', IconProps>;
}

const dirs = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

export const Toggler = forwardRef<ITogglerProps, 'svg'>((props, ref) => {
  const {
    isToggled = false,
    onDirection = 'down',
    offDirection = 'right',
    icon = ChevronRightIcon,
    ...iconProps
  } = props;

  const transform = isToggled
    ? getTransform(dirs[offDirection], dirs[onDirection])
    : getTransform(dirs[onDirection], dirs[offDirection]);

  return <Icon transform={transform} transition="transform .3s linear" {...iconProps} as={icon} ref={ref} />;
});

const getTransform = (from = 0, to = 90) => `rotate(${from}deg) rotate(${to - from}deg)`;
