/**
 * Extracts the enumerable keys of an object, filtering out any keys that can be
 * converted to a number.
 *
 * @template O - The type of the object.
 * @template K - The type of the keys of the object, defaults to keyof O.
 *
 * @param {O} obj - The object whose enumerable keys are to be extracted.
 *
 * @returns {K[]} - An array of the object's enumerable keys, excluding keys that can be converted to a number.
 */
export const enumKeys = <O extends object, K extends keyof O = keyof O>(obj: O): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};
