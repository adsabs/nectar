import { useEffect, useState } from 'react';

/**
 * SSR client-side hook for checking if we are on the client
 *
 * @link https://usehooks-ts.com/react-hook/use-is-client
 */
export const useIsClient = (): boolean => {
  const [isClient, setIsClient] = useState(false);

  // useEffect doesn't run during SSR
  useEffect(() => setIsClient(true), []);

  return isClient;
};
