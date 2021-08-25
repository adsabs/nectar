import { useEffect, useState } from 'react';

export enum Viewport {
  XS = 0,
  SM = 640,
  MD = 768,
  LG = 1024,
  XL = 1280,
  XXL = 1536,
}

export const useViewport = (): Viewport => {
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);

      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const viewport =
    width < Viewport.SM
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
