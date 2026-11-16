import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export const useIsPrinting = (): boolean => {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const onBeforePrint = () => {
      flushSync(() => setIsPrinting(true));
    };
    const onAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);

    const query = window.matchMedia?.('print');
    const onChange = (event: MediaQueryListEvent) => setIsPrinting(event.matches);
    query?.addEventListener?.('change', onChange);

    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      query?.removeEventListener?.('change', onChange);
    };
  }, []);

  return isPrinting;
};
