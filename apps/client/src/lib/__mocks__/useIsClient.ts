export const useIsClient = (): boolean => {
  // during testing, we should render client-side by default.
  // mock this manually in tests if server-side/non-js is desired
  return true;
};
