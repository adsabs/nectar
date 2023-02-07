import { ChevronRightIcon, IconProps } from '@chakra-ui/icons';
import { Center, forwardRef, IconButton, IconButtonProps } from '@chakra-ui/react';
import { ReactElement } from 'react';

type Dir = 'left' | 'right' | 'up' | 'down';

export interface ITogglerProps extends Partial<IconButtonProps> {
  isToggled?: boolean;
  onDirection?: Dir;
  offDirection?: Dir;
  renderIcon?: (props: IconProps) => ReactElement;
  offLabel?: string;
  onLabel?: string;
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
    renderIcon = (props) => <ChevronRightIcon {...props} />,
    onLabel = 'Toggle Off',
    offLabel = 'Toggle On',
    ...iconBtnProps
  } = props;

  const transform = isToggled
    ? getTransform(dirs[offDirection], dirs[onDirection])
    : getTransform(dirs[onDirection], dirs[offDirection]);

  return (
    <IconButton
      variant="unstyled"
      {...iconBtnProps}
      aria-label={isToggled ? onLabel : offLabel}
      icon={
        <Center>
          {renderIcon({
            transform,
            transition: 'transform .3s linear',
          })}
        </Center>
      }
      ref={ref}
    />
  );
});

const getTransform = (from = 0, to = 90) => `rotate(${from}deg) rotate(${to - from}deg)`;
