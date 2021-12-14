import { isBrowser } from '@utils';
import { useEffect, useState } from 'react';

/* these need to match the size defined in the theme */
export enum Viewport {
  BASE = 0, // mobile
  XS = 480, // small tablets, this is not defined by the theme, but useful to have
  SM = 640, // tablets
  MD = 768, // small screens, laptop
  LG = 1024, // desktop
  XL = 1280,
  XXL = 1536,
}
export const useViewport = (): Viewport => {
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    if (isBrowser()) {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);

      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const viewport =
    width < Viewport.XS
      ? Viewport.BASE
      : width < Viewport.SM
      ? Viewport.XS
      : width < Viewport.MD
      ? Viewport.SM
      : width < Viewport.LG
      ? Viewport.MD
      : width < Viewport.XL
      ? Viewport.LG
      : width < Viewport.XXL
      ? Viewport.XL
      : Viewport.XXL;
  return viewport;
};
