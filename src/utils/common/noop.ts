/**
 * A no-operation function that accepts any number of arguments and does nothing.
 *
 * This function can be used as a placeholder or default callback to avoid
 * runtime errors due to undefined functions.
 *
 * @param {...unknown} _args - Any number of arguments which will be ignored.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const noop = (..._args: unknown[]): void => {
  // do nothing
};
