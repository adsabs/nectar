import { useBreakpoint } from '@chakra-ui/react';

export const useScreenSize = () => {
  const breakpoint = useBreakpoint();
  const isScreenSmall = ['base', 'xs', 'sm'].includes(breakpoint, 0);
  const isScreenMedium = ['md'].includes(breakpoint, 0);
  const isScreenLarge = !isScreenSmall && !isScreenMedium;

  return { isScreenSmall, isScreenMedium, isScreenLarge };
};
